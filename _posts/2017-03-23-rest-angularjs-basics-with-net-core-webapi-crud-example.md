---
layout: post
title: "REST + AngularJS Basics With .Net Core WebAPI CRUD Example"
date: 2017-03-23 14:28
author: dasithlk
comments: true
categories: [Angular, Web API]
tags: [.net, angularjs, netcore, rest, webapi]
---
Yes, I have been MIA for a while. I have been on holidays for an extended period of time and started working for a software consultancy a few weeks ago. So my busy schedule hasn't given me an opportunity to blog.


### Why Front End, Dasith?


I'm getting my hands dirty with with AngularJS for a brownfield project and wanted to write some material to help other team members who might not have been exposed to Angular before. So I took that opportunity to write it in a form of a blog post. I know front end tech is not my focus, but as a full stack developer it is important you know at least one major JavaScript mv* framework. It might even come handy when you need to whip up a quick prototype to demonstrate a back end feature to a customer. Bottom line is that we back end developers can't ignore the front end technologies.

I'm using Angular 1.6 for this because it was a brownfield project and the existing code base was in 1.*. But** if you are starting a new project I highly recommend you familiarize yourself with Typescript and Angular 2. **(Strongly typed master race is a thing right?)

<hr />

So let's jump right in. It a prerequisite of this post to have an understand of the building blocks of an Angular app. You should have a basic understanding of a module, controller, services, data binding, filtering and directives. A good start is the Angular docs <a href="https://docs.angularjs.org/guide" target="_blank">https://docs.angularjs.org/guide</a>.

I have uploaded the code covered in the article into a github repo at <a href="https://github.com/dasiths/AngularJsWebApiTest" target="_blank">https://github.com/dasiths/AngularJsWebApiTest</a> and will be doing any feature additions and bug fixes there. Consider this post as a guide only.


#### Module.js


[code language="javascript" collapse="false" gutter="true"]
// Define the `booksApp` module
var app = angular.module('booksApp', []);
[/code]

This is where we define the name of the module and have it assign to a global variable for later use. Nothing fancy here.


####  Service.js


[code language="javascript" collapse="false" gutter="true"]
app.service('crudService', function ($http) {

 var baseUrl = 'http://localhost:50829';

 //Create new record
 this.post = function (Book) {
 var request = $http({
 method: &quot;post&quot;,
 url: baseUrl + &quot;/api/books&quot;,
 data: Book
 });
 return request;
 }

 //Get Single Records
 this.get = function (Id) {
 return $http.get(baseUrl + &quot;/api/books/&quot; + Id);
 }

 //Get All Books
 this.getAllBooks = function () {
 return $http.get(baseUrl + &quot;/api/books&quot;);
 }

 //Update the Record
 this.put = function (Id, Book) {
 var request = $http({
 method: &quot;put&quot;,
 url: baseUrl + &quot;/api/books/&quot; + Id,
 data: Book
 });
 return request;
 }

 //Delete the Record
 this.delete = function (Id) {
 var request = $http({
 method: &quot;delete&quot;,
 url: baseUrl + &quot;/api/books/&quot; + Id
 });
 return request;
 }
});
[/code]

We are defining the functions (they are actually called "promises") here. Each of these functions handles a CRUD operation and points an end point. By putting these functions inside the service we are separating the concerns from the controller. We can later inject this service in to the controller. Have a read here <a href="https://www.sitepoint.com/tidy-angular-controllers-factories-services/" target="_blank">https://www.sitepoint.com/tidy-angular-controllers-factories-services/</a>.


#### Controller.js


[code language="javascript" collapse="false" gutter="true"]
app.controller('BookListController', function BookListController($scope, $http, crudService) {
 $scope.statusClass = 'label-info';
 $scope.status = 'Loading books...';
 $scope.IsNewRecord = 1; //The flag for the new record

 loadAllBooks();

 function loadAllBooks() {

 var promise = crudService.getAllBooks();

 promise.then(
 function (response) {
 $scope.Books = response.data;
 $scope.status = 'Loaded. Code: ' + response.status;
 $scope.statusClass = 'label-success';
 },
 function (error) {
 $scope.Books = null;
 $scope.status = 'Error: ' + error;
 $scope.statusClass = 'label-warning';
 $log.error('failure loading Books', error);
 });
 }

 //Method to save and add
 $scope.save = function () {
 var Book = {
 Id: $scope.BookId,
 Name: $scope.BookName,
 Author: $scope.BookAuthor
 };

 //If the flag is 1 the it is a new record
 if ($scope.IsNewRecord === 1) {
 var promisePost = crudService.post(Book);
 promisePost.then(function (result) {
 $scope.BookId = result.data;
 loadAllBooks();
 }, function (error) {
 $scope.status = 'Error: ' + error;
 console.log(&quot;Err&quot; + error);
 });
 } else { //Else Edit the record
 var promisePut = crudService.put($scope.BookId, Book);
 promisePut.then(function (result) {
 $scope.status = &quot;Updated Successfuly&quot;;
 $scope.statusClass = 'label-success';
 loadAllBooks();
 }, function (error) {
 $scope.status = 'Error: ' + error;
 $scope.statusClass = 'label-warning';
 console.log(&quot;Err&quot; + error);
 });
 }

 }

 //Method to Delete
 $scope.delete = function () {
 var promiseDelete = crudService.delete($scope.BookId);
 promiseDelete.then(function (result) {
 $scope.status = &quot;Deleted Successfuly&quot;;
 $scope.statusClass = 'label-success';
 $scope.BookId = 0;
 $scope.BookName = &quot;&quot;;
 $scope.BookAuthor = &quot;&quot;;

 loadAllBooks();
 }, function (error) {
 $scope.status = 'Error: ' + error;
 $scope.statusClass = 'label-warning';
 console.log(&quot;Err&quot; + error);
 });
 }

 //Method to Get Single Book
 $scope.get = function (Book) {
 var promiseGetSingle = crudService.get(Book.id);

 promiseGetSingle.then(function (result) {
 var res = result.data;
 $scope.BookId = res.id;
 $scope.BookName = res.name;
 $scope.BookAuthor = res.author;

 $scope.IsNewRecord = 0;
 },
 function (errorPl) {
 console.log('failure loading Employee', errorPl);
 });
 }

 //Clear the Scope models
 $scope.clear = function () {
 $scope.statusClass = 'label-info';
 $scope.status = &quot;&quot;;
 $scope.IsNewRecord = 1;
 $scope.BookId = 0;
 $scope.BookName = &quot;&quot;;
 $scope.BookAuthor = &quot;&quot;;
 }

}).directive('myBooktableheader', function () {
 return {
 templateUrl: 'http://localhost:51836/BookTemplate.html'
 };
});
[/code]

Here we have the controller that coordinates everything. As we discussed earlier notice how the crudService is injected in. Dependency Injection is a major part of how Angular works. Read more here <a href="https://docs.angularjs.org/guide/di" target="_blank">https://docs.angularjs.org/guide/di</a>.

Everything here is pretty straight forward. We just created methods to load and save books. We have some fields in the scope that we use to bind the input fields to ($scope.BookId, BookName, BookAuthor). Read more here <a href="https://www.w3schools.com/angular/angular_databinding.asp" target="_blank">https://www.w3schools.com/angular/angular_databinding.asp</a>.

To demonstrate directives, I have also added a custom directive definition right at the end of the controller which has an external template.


#### BookTemplate.html


[code language="html" collapse="false" gutter="true"]
&lt;th&gt;Id&lt;/th&gt;
&lt;th&gt;Name&lt;/th&gt;
&lt;th&gt;Author&lt;/th&gt;
&lt;th&gt;&lt;/th&gt;
[/code]

Directives are a big topic onto itself. We are covering the very basic use here for a trivial example. Read more about directives here <a href="https://docs.angularjs.org/guide/directive" target="_blank">https://docs.angularjs.org/guide/directive</a>.


#### Book.cshtml (partial code example)


See full code at <a href="https://github.com/dasiths/AngularJsWebApiTest/blob/master/AngularWebApplication/Views/Book/Index.cshtml" target="_blank">https://github.com/dasiths/AngularJsWebApiTest/blob/master/AngularWebApplication/Views/Book/Index.cshtml</a>.

[code language="html" collapse="false" gutter="true"]
&lt;body ng-controller=&quot;BookListController&quot;&gt;
&lt;div class=&quot;body-content&quot;&gt;
&lt;h3&gt;@ViewData[&quot;Message&quot;]&lt;/h3&gt;
&lt;table&gt;
&lt;tr&gt;
&lt;td&gt;
&lt;table id=&quot;searchObjResults&quot; class=&quot;table-striped table-hover&quot; width=&quot;600&quot;&gt;
&lt;tr my-Booktableheader&gt;&lt;/tr&gt;
&lt;tr ng-repeat=&quot;book in Books | filter:search:strict&quot;&gt;
&lt;td&gt;{{book.id}}&lt;/td&gt;
&lt;td&gt;{{book.name}}&lt;/td&gt;
&lt;td&gt;{{book.author}}&lt;/td&gt;
&lt;td&gt;
 &lt;button type=&quot;button&quot; class=&quot;btn&quot; ng-click=&quot;get(book)&quot;&gt;
 &lt;span class=&quot;glyphicon glyphicon-edit&quot;&gt;&lt;/span&gt;
 &lt;/button&gt;&lt;/td&gt;
&lt;/tr&gt;
... see github for repo for full code

 &lt;label ng-class=&quot;statusClass&quot;&gt;Status: {{status}}&lt;/label&gt;

Use this area to filter results.

 &lt;label&gt;Any: &lt;input ng-model=&quot;search.$&quot;&gt;&lt;/label&gt;

 &lt;label&gt;Name only &lt;input ng-model=&quot;search.name&quot;&gt;&lt;/label&gt;

 &lt;label&gt;Author only &lt;input ng-model=&quot;search.author&quot;&gt;&lt;/label&gt;

 &lt;label&gt;Equality &lt;input type=&quot;checkbox&quot; ng-model=&quot;strict&quot;&gt;&lt;/label&gt;

[/code]

This will be our template for the main web page. Take note of how we use data binding using one-way and two-way data binding directives. More here <a href="https://www.w3schools.com/angular/angular_databinding.asp" target="_blank">https://www.w3schools.com/angular/angular_databinding.asp</a>.

The other thing to note here is the filtering. We have some typical examples of filter use covered in the example. Read more about filters here <a href="https://www.w3schools.com/angular/angular_filters.asp" target="_blank">https://www.w3schools.com/angular/angular_filters.asp</a>.

Well that's it for the Client side of the application. Now let's quickly look at the WebAPI end point.

I'm using Visual Studio 2017 to create my project. I created a project using the ASP.NET CORE web api template.


#### BookRepository.cs


[code language="csharp" collapse="false" gutter="true"]
 public class BookRepository
 {
 private List&lt;Book&gt; _books = new List&lt;Book&gt;();
 public BookRepository()
 {
 _books.Add(new Book() { Id = 1, Name = &quot;P=NP in .NET&quot;, Author = &quot;Jon Skeet&quot; });
 _books.Add(new Book() { Id = 2, Name = &quot;Dank Memes&quot;, Author = &quot;Dasith Wijes&quot; });
 _books.Add(new Book() { Id = 3, Name = &quot;50 'Shards' of Azure SQL&quot;, Author = &quot;Actor Model&quot; });
 _books.Add(new Book() { Id = 4, Name = &quot;Jailbreaking iOS to Set a Default Web Browser&quot;, Author = &quot;Cult Of Fandroid&quot; });
 _books.Add(new Book() { Id = 5, Name = &quot;OCD Olympics&quot;, Author = &quot;Also Me&quot; });
 }

 public IEnumerable&lt;Book&gt; GetAllBooks()
 {
 return _books.ToArray();
 }

 public void UpdateBook(Book b)
 {
 _books[_books.IndexOf(_books.Single(o =&gt; o.Id == b.Id))] = b;
 }

 public int AddBook(Book b)
 {
 b.Id = _books.Max(o=&gt; o.Id) + 1;
 _books.Add(b);

 return b.Id;
 }

 public void DeleteBook(int id)
 {
 _books.Remove(_books.Single(o =&gt; o.Id == id));
 }
 }
[/code]


#### Startup.cs


I **enabled CORS** as follows in startup.cs because our Angular app will be communicating from a different "host". (The angular app runs as a separate application on a separate port to the webapi.) Also I added the repository as a singleton to the IOC container.

[code language="csharp" collapse="false" gutter="true"]
public class Startup
{
public Startup(IHostingEnvironment env)
{
var builder = new ConfigurationBuilder()
.SetBasePath(env.ContentRootPath)
.AddJsonFile(&quot;appsettings.json&quot;, optional: false, reloadOnChange: true)
.AddJsonFile($&quot;appsettings.{env.EnvironmentName}.json&quot;, optional: true)
.AddEnvironmentVariables();
Configuration = builder.Build();
}

public IConfigurationRoot Configuration { get; }

// This method gets called by the runtime. Use this method to add services to the container.
public void ConfigureServices(IServiceCollection services)
{
// Add framework services.
services.AddCors();
services.AddMvc();

//Add our repository as a singleton
services.AddSingleton&lt;Repository.BookRepository&gt;();
}

// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
{
loggerFactory.AddConsole(Configuration.GetSection(&quot;Logging&quot;));
loggerFactory.AddDebug();

app.UseCors(builder =&gt; builder.WithOrigins(&quot;*&quot;)
.AllowAnyOrigin()
.AllowAnyMethod()
.AllowAnyHeader());

app.UseMvc();
}
}
[/code]


####  BookController.cs


This is your stock standard web api controller. I've put some effort into wrapping my results with the proper http status codes and handling some errors. This is by no means perfect but just note how the web api communicates back via both the status code and content.

[code language="csharp" collapse="false" gutter="true"]
[Route(&quot;api/[controller]&quot;)]
public class BooksController : Controller
{

BookRepository _repo;

public BooksController(BookRepository repo)
{
_repo = repo;
}

// GET api/books
[HttpGet]
public IActionResult Get()
{
var result = _repo.GetAllBooks();

if (result.Count() &gt; 0)
return Ok(result);
else
return NoContent();
}

// GET api/books/id
[HttpGet(&quot;{id}&quot;)]
public IActionResult Get(int id)
{
var result = _repo.GetAllBooks().SingleOrDefault(o =&gt; o.Id == id);

if (result == null)
return NoContent();
else
return Ok(result);
}

// GET api/books/q=query
[HttpGet(&quot;q={name}&quot;)]
public IActionResult Get(string name)
{
var results = _repo.GetAllBooks().Where(
o =&gt; o.Name.IndexOf(name, 0, StringComparison.OrdinalIgnoreCase) &gt;= 0);

if (results.Count() &gt; 0)
{
return Ok(results);
}
else
{
return NoContent();
}

}

// POST api/books
[HttpPost]
public IActionResult Post([FromBody] Book b)
{
if (ModelState.IsValid == false)
return BadRequest();

try
{
return Ok(_repo.AddBook(b));
}
catch (Exception ex)
{
return BadRequest(ex.Message);
}

}

// PUT api/books/id
[HttpPut(&quot;{id}&quot;)]
public IActionResult Put(int id, [FromBody] Book b)
{

if (ModelState.IsValid == false || id != b.Id)
return BadRequest();

var result = _repo.GetAllBooks().SingleOrDefault(o =&gt; o.Id == id);
if (result == null)
return NotFound();

try
{
_repo.UpdateBook(b);
return Ok(id);
}
catch (Exception ex)
{
return BadRequest(ex.Message);
}
}

// DELETE api/books/id
[HttpDelete(&quot;{id}&quot;)]
public IActionResult Delete(int id)
{
try
{
_repo.DeleteBook(id);
return Ok(id);
}
catch (Exception ex)
{
return BadRequest(ex.Message);
}
}

}
[/code]

That's it. We have covered the major components in the project. Run it and see if you can have a play with it.

![AngularWebAPI](https://gossipprotocol.files.wordpress.com/2017/03/angularwebapi.png)

Good luck with your learning. I recommend you learn more about a topic like <a href="http://www.c-sharpcorner.com/UploadFile/ff2f08/token-based-authentication-using-Asp-Net-web-api-in-angularj/" target="_blank">token authentication using Angular + webapi</a> because it will be something you will end up doing often. Another important area we didn't cover here is <a href="https://scotch.io/tutorials/angularjs-multi-step-form-using-ui-router" target="_blank">routing</a>.

Please post your comments and ideas here as they help me improve my knowledge and blogging skills. Thank you.
