---
title: "Object Capability Model And Mapping"
date: 2021-03-09 22:06
comments: true
header:
  teaser: /assets/images/rc-4309881_640.jpg
categories: [Design Patterns, Object Oriented Programming]
tags: [design-patterns, software, object-oriented-programming]
---
Almost any type of software development work requires some sort mapping in the logic. Either from the persistence models to domain model or from the domain models to view models. In my experience dealing with a lot of brownfield projects, I've seen some practices that don't age well and make it harder to understand the intent. Some of these approaches age gracefully like a beer. Although my aim is not to kick a dead horse and [rant about AutoMapper](https://cezarypiatek.github.io/post/why-i-dont-use-automapper/), I agree with the sentiments provided in that linked post. I recommend you read it if you haven't already. **Pay attention to the comment thread** there where Jimmy Bogard gives some decent pointers on when and when not to use it.

*I haven't been blogging as often as I would like to. I've recently started a new job and it's been keeping me quite busy. I'm taking the latest snap lockdown in lieu of Covid19 in Victoria, Australia to write this. I wanted to do this before I reward myself with binging Netflix. This is a topic I've wanted to express my opinion on for a while.*

In this post I'll be expanding on some of the arguments made in that linked post.

    tl;dr; I'm complaining about how your mapping choices affect maintainability, understandability and code navigation.

## Object Capability Model

Before we dive in, I want to introduce the [Object Capability Model](https://en.wikipedia.org/wiki/Object-capability_model) to those of you who haven't heard of it. (Most software developers understand it intuitively).

    The object-capability model is a computer security model. A capability describes a transferable right to perform one (or more) operations on a given object. It can be obtained by the following combination:
    
    - An unforgeable reference (in the sense of object references or protected pointers) that can be sent in messages.
    - A message that specifies the operation to be performed.

To put it simply it's a model which describes the capabilities of an object. The security implication is that, we should aim to give the **least amount of privileges required to an object to able to perform its responsibilities**.

In modern software development we give capabilities to an object through the references it holds. If you're following inversion of control pattern in your design, this is often done through dependency injection via the constructor.

When I'm working on a brownfield project or a large project and trying to understand and navigate the code, I often look at the constructor of a class to understand the capabilities of it. This allows me to understand the what other area of the system can potentially impact this class as well. Now I know there are better ways to to do this i.e. Dependency Graph but it's not something you can quickly access or visualise.

So what does this mean for mapping?

## The Problem With AutoMapper

The shortcomings of (or ways developers abuse) AutoMapper are well documented. I won't repeat them again here. Please read the article linked above. My take is more targeted around how it affects the understandability of object capability.

Let's take this class as an example:
```csharp
public class Foo {

  private readonly IMapper _mapper { get; set; }

  public Foo(IMapper mapper) {
    _mapper = mapper;
  }
  ...
}
```

If we look at the constructor here, we know the class uses *some* mapping but it's not clear what. I have to go through the code to understand the `from` and `to` models or indeed if there are multiples of them. Yes it's not the end of the world. A software developer needing to read the code to understand it, the horror.

But this cognitive load adds up. Especially when you consider the fact that mapping is something done every time an object needs to be presented to/from a layer. (Lets rant about enterprise software development at a later time shall we?). This also poses a hurdle in easily understanding the impact this class has. It is very hard to navigate to the mapping logic and therefore **hard to understand the capabilities this class will ultimately have**. This impacts us in giving the class the least amount of privileges required to perform its actions.

## So, `IMapper<TFrom,TTo>` then?

This is another alternative to AutoMapper. Here we define an interface `IMapper<TFrom,TTo>` like
```csharp
public interface IMapper<DomainModel, ViewModel> {
  public TTo Map(TFrom model);
}
```
and implement it
```csharp
public class CustomerViewModelMapper : IMapper<CustomerDomainModel, CustomerViewModel> {  
  public CustomerViewModel Map(TFrom CustomerDomainModel) {
    // mapping logic here
  }
}
```
Using it is pretty easy

```csharp
public class Foo {

  private readonly IMapper<CustomerDomainModel, CustomerViewModel> _mapper { get; set; }

  public Foo(IMapper<CustomerDomainModel, CustomerViewModel> mapper) {
    _mapper = mapper;
  }
  ...
}
```
Something I like about this approach is whenever you see `IMapper<TFrom, TTo>` **you instantly know what capability it provides** to the dependant class. You don't have to rely on the name of the dependency. (We know how bad we are at naming things).

One of the other aspects that is appealing with this approach is that you can **automatically scan your assemblies for implementations of `IMapper<TFrom,TTo>` and register it in your dependency injection** . This means you have one less thing to worry about.

```csharp
    public static class MapperModule
    {
        public static void AddMappers(this IServiceCollection services, IConfiguration configuration)
        {
            var serviceType = typeof(IMapper<,>);
            ScanServiceType(services, serviceType);
        }

        private static void ScanServiceType(IServiceCollection services, Type serviceType)
        {
            var mapperTypes = DependentAssemblies.All
                            .SelectMany(a => a.GetTypes())
                            .Where(type => type.GetInterfaces() != null &&
                                           type.GetInterfaces().Any(
                                               t => t.IsGenericType &&
                                                    t.GetGenericTypeDefinition() == serviceType) &&
                                           type.IsClass &&
                                           !type.IsAbstract);

            foreach (var mapperType in mapperTypes)
            {
                var @interfaces = mapperType.GetInterfaces().Where(t => t.IsGenericType &&
                                                              t.GetGenericTypeDefinition() == serviceType);
                foreach (var @interface in @interfaces)
                {
                    services.AddScoped(@interface, mapperType);
                }
            }
        }
    }
```
If you've been paying attention then you might have noticed something that is making me look like a hypocrite. We wanted to make code navigation easier, but now we have a dependency on `IMapper<CustomerDomainModel, CustomerViewModel>` and it's hard to navigate to the actual implementation because Visual Studio can't detect implementations of generic types without the help of extensions/plugins. Sure it's better from a "understanding object capability" perspective but unless you have Resharper installed we haven't really made code navigation any easier. Also me being absent minded, have taken a dependency on `IMapper<TFrom, TTo>` in a class only to realise at runtime that there is no implementation for it.

One could even argue that DI auto register magic is bad. So where does that leave us?

## Simple classes that only map. Who would have thought?

These days this is my go to option.
```csharp
public class CustomerViewModelMapper {

	private readonly AddressServiceMapper addressServiceMapper;
	
	public CustomerViewModelMapper(AddressServiceMapper addressServiceMapper)
	{
		this.addressServiceMapper = addressServiceMapper;
	}
	
	public CustomerViewModel Map(CustomerDomainModel model)
	{
		return new CustomerViewModel {
			BusinessName = model.BusinessName,
			Address = this.addressServiceMapper.Map(entity.Address)
		};
	}
}
```
Using it is straight forward again.
```csharp
public class Foo {

  private readonly CustomerViewModelMapper _mapper { get; set; }

  public Foo(CustomerViewModelMapper mapper) {
    _mapper = mapper;
  }
  ...
}
```
Notice how I didn't bother with an interface here. The truth is you don't need one. I can't see any reason to mock the mapper. If you have other dependencies inside the mapper that need mocking, then it's a code smell. (i.e. Don't call the database during a mapping operation etc).

## Why not a static map method?

Can't we just do away with dependency injection and just use a static `CustomerViewModelMapper` class with a static `Map()` method? IMO this defeats one of the aspects I wanted to achieve. Understandability of object capability easily. I made the point about how using statement, constructor signature and public settable properties are my go to place to understand the capabilities of the class. When you have calls the static methods sprinkled in code it becomes another cognitive load to understand object capability.

## Bonus: Revelations (from functional programming)

Given the above options the best outcome here is to rely on a mapping function to be injected. I'll wait for a proponent on a functional programming to give a more theoretical answer to why this is the most elegant answer.

```csharp
public class Foo {

  private readonly Func<CustomerDomainModel, CustomerViewModel> _mapper { get; set; }

  public Foo(Func<CustomerDomainModel, CustomerViewModel> mapper) {
    _mapper = mapper;
  }
  ...
}
```

Here we don't rely on a class. We rather rely on much more narrowly scoped capability via a Function signature (or delegate). But then again Visual Studio (or any IDE I know) does not support navigation from a `Func<CustomerDomainModel, CustomerViewModel>` to the implementation easily.

## Closing Remarks

We explored how mapping relates of the object capability model and why easy to understand/navigate solution helps us with it. We also went through some mapping design patterns and discussed the pros and cons with them.

My advice is to keep the mapping logic simple as explained in the last few examples. You want the least amount of cognitive load when reading and navigation through your code base. Especially as it evolves and "matures" so that new developers to the team can start being productive faster and make less errors. You don't want to design a pattern that lets developers shoot them selves in the foot easily with.

Mapping can be tedious the way I recommended. Yes I completely agree. Maybe consider using something like [this](https://github.com/cezarypiatek/MappingGenerator). The concept behind it is explained [here](https://cezarypiatek.github.io/post/generate-mappings-on-build/). With C# 9, we got [source generators](https://devblogs.microsoft.com/dotnet/introducing-c-source-generators/) and we could have some potentially creative solution there as well.

I'm keen to learn about your own experiences as well. Please reach out to me via twitter @dasiths or post a comment here if you have some interesting opinion or view related to this. Happy coding.