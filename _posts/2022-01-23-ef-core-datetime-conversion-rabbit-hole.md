---
title: "Going down the rabbit hole of EF Core and converting strings to dates"
date: 2022-01-23 22:06
comments: true
categories: [.NET, EF Core, SQL Server]
tags: [.net, efcore, sql server]
toc: true
toc_label: "Content"
toc_sticky: true
---
I am working on a greenfield project that uses EF Core 6 with AspNetCore 6 at the moment. The project involves exposing a set of legacy data through an API. Simple enough right?

The underlying data is stored in SQL Server 2019 but it is not very well designed. There are `varchar` columns for storing `boolean`, `numeric` and `date/time` values. It's not uncommon to see these types of data stores though. As developers we have to deal with them often.

## Dapper or EF Core

When choosing the data access layer for the project I had the option to go with [Dapper](https://github.com/DapperLib/Dapper) or EF Core. I choose to go with EF Core because this specific API had a lot of requirements around paging and sorting (See here for [more](https://api.gov.au/standards/national_api_standards/)). You can easily implement paging and sorting with Dapper too. But I find constructing paging and sorting dynamically using EF Core `IQueryable` more appealing than manipulating strings in Dapper. I will do another post about dynamic paging and sorting using EF Core soon.

But this choice comes with trade offs as with any technical decision. While I don't have to "construct" SQL with string manipulation, an ORM comes at a cost of not being able to execute the exact SQL I want if I'm using `IQueryable` to construct my LINQ query. This is a hot topic when it comes to designing your data access layer but that is a topic for another post.

## The Problem

Imagine the following schema for a table called `CustomerLease`.

| Column     | Data Type           |
|------------|---------------------|
| LeaseId         | int                 |
| CustomerId | int                 |
| LeasedItem | nvarchar(2000) NULL |
| LeaseStart   | nvarchar(10)   |
| LeaseEnd     | nvarchar(10) NULL   |

We are required to find customer leases that started after a given date.

Now lets assume what we would do if the `LeaseStart` was `DateTime` .NET Type in my EF Core entity model for `CustomerLease`.

```c#
  public class CustomerLease
  {
    //... other fields
    DateTime LeaseStart {get; set;}
  }

  public class MyRepo {

      // constructor and other properties will go here...

      // example method to search within date periods
      public async Task<List<CustomerLease>> GetCustomerLeases(SearchRequest request) 
      {
          var searchFrom = request.SearchFrom;

          var query = MyDataContext.CustomerLeases
                  .Where(c => searchFrom <= c.LeaseStart);

          return await query.ToListAsync();      
      }  
  }

```
**This solution would work if my underlying DB type was DateTime BUT it is not.**

So my actual entity model looks like...

```csharp
  public class CustomerLease
  {
    //... other fields
    string LeaseStart {get; set;}
  }
```

### Now I can't write my LINQ query with direct comparison to SearchFrom. What are my alternatives?

1. Try converting the `string` to a `DateTime` within the LINQ query.
    ```
    DateTime.Parse(...)
    // or
    Convert.ToDateTime(...)
    ```

    This will work if our underlying `IQueryable` provider for SQL Server supported translating these functions to SQL. But unfortunately [they aren't](https://docs.microsoft.com/en-us/ef/core/providers/sql-server/functions). So this approach is out of the question.

2. Using implicit conversion .
   
    ```
    .Where(c => searchFrom <= (DateTime)(object)c.LeaseStart
    ```

    This technique generates the following SQL. "`CAST([S].[LeaseStart] as DateTime) >= @__searchFrom__`" This will work but word of caution. This double casting we have done in LINQ to trick the underlying provider to use CAST will only work for SQL Provider. It **will not work** for the In-Memory database provider if you're using it for writing unit/integration tests.

    The other drawback here is that it expects the dates to be in the default format of the current session language. (i.e. US English, British English etc). If you have a date there like `24/05/2021` and the the current language is US English then it will fail with a message like `"The conversion of a varchar data type to a datetime data type resulted in an out-of-range value".` I talk about this again below in option 3 and touch on some work arounds.

3. Using EF Core value converter.
   
    With EF Core 5+ you can use [`Value Converters`](https://docs.microsoft.com/en-us/ef/core/modeling/value-conversions?tabs=data-annotations#built-in-converters) for this scenario and there are [built in ones](https://docs.microsoft.com/en-us/dotnet/api/microsoft.entityframeworkcore.storage.valueconversion.stringtodatetimeconverter?view=efcore-6.0) for some common use cases.

    Be mindful that ValueConverters work inside .NET and not SQL. So how do we get it to do a CAST on our `varchar` column?

    ```csharp
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      // The column TextDate is the one that has date values but stored as text in the db
        modelBuilder
            .Entity<CustomerLease>()
            .Property(c => c.LeaseStart) 
            .HasConversion<string>();
    }

    public class CustomerLease
    {
      //... other fields
      DateTime LeaseStart {get; set;}    
    }
    ```
    Then in LINQ simply do `.Where(e => e.LeaseStart >= startSearch)`. 
    
    Here is the kicker. For EF Core to generate the correct SQL statement, **it will require `startSearch` parameter inside the LINQ query to be of type `DateTimeOffset`**.
    
    It doesn't use CAST if the parameter is `DateTime` as it simply converts your parameter to `varchar` and then compares. I made [this gist](https://gist.github.com/dasiths/19b885c58442226d9fc8b89bc78511e4) to demo the behaviour. 
    
    This is more of a hack as we are relying on implicit conversion of `DateTime` from/to `DateTimeOffset` inside .NET and then letting the EFCORE SQL Provider do a CAST when comparing inside SQL.

    The above LINQ will generate SQL like...

    ```sql
    DECLARE @__startSearch_0 datetimeoffset = '2022-01-22T23:01:43.0090270+11:00';

    # and query like
    WHERE ((@__startSearch_0 <= CAST([s].[LeaseStart]) AS datetimeoffset))
    ```
    
    The only good things about the ValueConverter here is that it simply allows us to have the Entity Model field type as a `DateTime` but doesn't actually do anything when querying. You can remove the `.HasConversion<string>()` notation from the model builder and the logic for querying will still work regardless.

    Again this has the same draw back as option 2 even though it does work with In-Memory DB. If you read the value converters documentation page linked above it says the DateTime/String converter uses "Invariant Culture". Which means it uses `MM/dd/yyyy` by [default](https://stackoverflow.com/questions/46778141/datetime-formats-used-in-invariantculture). Which might not be ideal for non us based data.    
    
    Just like option 2 it uses `CAST` and is **susceptible to the column having dates in a format that is different to the session's** [language setting](https://docs.microsoft.com/en-us/sql/t-sql/statements/set-language-transact-sql?view=sql-server-ver15). 
    
    For example if you have data in that text column in the form of `dd/MM/yyyy` then `SET LANGUAGE "British English"` before you execute your SQL query which has the CAST to avoid the `"The conversion of a varchar data type to a datetime data type resulted in an out-of-range value"` error. The default language can be set to the SQL login if you don't want to execute the SET LANGUAGE command each time.

4. Using Custom [SQL Translation](https://docs.microsoft.com/en-us/ef/core/querying/user-defined-function-mapping).

    ```csharp
    public static class ModelBuilderExtensions
    {
        public static DateTime? ToDateTime(this string dateString, int format) => throw new NotSupportedException();

        public static ModelBuilder AddSqlConvertFunction(this ModelBuilder modelBuilder)
        {
            modelBuilder.HasDbFunction(() => ToDateTime(default, default))
                .HasTranslation(args => new SqlFunctionExpression(
                        functionName: "CONVERT", 
                        arguments: args.Prepend(new SqlFragmentExpression("date")),
                        nullable: true,
                        argumentsPropagateNullability: new[] { false, true, false },
                        type: typeof(DateTime),
                        typeMapping: null));

            return modelBuilder;
        }
    }

    // then on model creating
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      if (Database.IsSqlServer()){
        modelBuilder.AddSqlConvertFunction();
      }
    }

    // entity model
    public class CustomerLease
    {
      public string LeaseStart {get; set;}      
    }

    // To query
    var dateFormat = 103; // See all date formats here https://www.w3schools.com/sql/func_sqlserver_convert.asp
    var query = db.Set<CustomerLease>()
          .Where(c => c.LeaseStart.ToDateTime(dateFormat) >= searchStart);   
    ```

    This will result in a SQL query like below..
    ```sql
    ((@__startSearch__ <= CONVERT(date, [s].[LeaseStart], 103);)
    ```
    This is a much more precise solution as we explicitly define the date format we want for the conversion. One of the drawbacks with this approach for me was that I couldn't get this to work with In-Memory DB provider which I used for unit/integration tests. Your mileage may vary.

5. Use the `EF.Functions.DateFromParts(year, month, day)` function.

    Here you write the query using `EF.Functions.DateFromParts` function and pass the year, month and day in. This means you need to use `LeaseStart.substring(x,x)` to split extract each part and construct a proper date. I won't write an example query here as the date formats will determine the substring start/end for each component.

    The drawback from this approach is again that `EF.Functions.DateFromParts` has no translation in In-Memory DB.

6. Use the correct data type in SQL Server. 
   
    Simple isn't it? You just add a new column and map the current column with a CAST and populate the new one. For scenarios where you can't, maybe you create a new view with the desired data types. Yes it has performance implications but it is another option to consider nevertheless.

## Conclusion

We learned that our data access layer tooling and abstractions come with trade offs. We also learnt that converting a string column type to date within a LINQ query is not trivial when it comes to EF Core SQL Provider.

Hopefully this gives you some options to try. While I can't emphasise enough how important it is to have your underlying database column types represented in the correct data type sometimes we don't have the option to change that. Not immediately anyway.

So I went back to the DBA and convinced them to change the underlying data type to reflect the correct type. This meant my entity model and LINQ query are much simpler and make sense in the domain.

Please let me know what you thought about this post and if you have other/better techniques to deal with this problem. Thanks for reading and have a great day.

### References
- https://stackoverflow.com/questions/68728498/convert-string-to-datetime-in-linq-query-with-entity-framework-core
- https://stackoverflow.com/questions/60969027/how-to-convert-string-to-datetime-in-c-sharp-ef-core-query
- https://stackoverflow.com/questions/20838344/sql-the-conversion-of-a-varchar-data-type-to-a-datetime-data-type-resulted-in/40106812#40106812  
- https://docs.microsoft.com/en-us/sql/t-sql/functions/cast-and-convert-transact-sql?view=sql-server-ver15
- https://docs.microsoft.com/en-us/ef/core/providers/sql-server/functions
- https://docs.microsoft.com/en-us/ef/core/modeling/value-conversions
- https://docs.microsoft.com/en-us/sql/t-sql/statements/set-language-transact-sql?view=sql-server-ver15
