---
title: "REST + AngularJS Basics With .Net Core WebAPI CRUD Example"
date: 2017-03-23 14:28
comments: true
categories: [Angular, Web API]
tags: [.net, angularjs, netcore, rest, webapi]
header:
  teaser: /assets/images/angularwebapi.png
---
In this blog post I look at some basic examples of using AngularJs with Asp.Net WebApi.

Yes, I have been MIA for a while. I have been on holidays for an extended period of time and started working for a software consultancy a few weeks ago. So my busy schedule hasn't given me an opportunity to blog.


### Why Front End, Dasith?


I'm getting my hands dirty with with AngularJS for a brownfield project and wanted to write some material to help other team members who might not have been exposed to Angular before. So I took that opportunity to write it in a form of a blog post. I know front end tech is not my focus, but as a full stack developer it is important you know at least one major JavaScript mv* framework. It might even come handy when you need to whip up a quick prototype to demonstrate a back end feature to a customer. Bottom line is that we back end developers can't ignore the front end technologies.

I'm using Angular 1.6 for this because it was a brownfield project and the existing code base was in 1.*. But** if you are starting a new project I highly recommend you familiarize yourself with Typescript and Angular 2. **(Strongly typed master race is a thing right?)

<hr />

So let's jump right in. It a prerequisite of this post to have an understand of the building blocks of an Angular app. You should have a basic understanding of a module, controller, services, data binding, filtering and directives. A good start is the Angular docs <a href="https://docs.angularjs.org/guide" target="_blank">https://docs.angularjs.org/guide</a>.

I have uploaded the code covered in the article into a github repo at <a href="https://github.com/dasiths/AngularJsWebApiTest" target="_blank">https://github.com/dasiths/AngularJsWebApiTest</a> and will be doing any feature additions and bug fixes there. Consider this post as a guide only.


#### Module.js


```javascript
// Define the `booksApp` module
var app = angular.module('booksApp', []);
```

This is where we define the name of the module and have it assign to a global variable for later use. Nothing fancy here.


####  Service.js


```javascript
app.service('crudService', function ($http) {

 var baseUrl = 'http://localhost:50829';

 //Create new record
 this.post = function (Book) {
 var request = $http({
 method: "post",
 url: baseUrl + "/api/books",
 data: Book
 });
 return request;
 }

 //Get Single Records
 this.get = function (Id) {
 return $http.get(baseUrl + "/api/books/" + Id);
 }

 //Get All Books
 this.getAllBooks = function () {
 return $http.get(baseUrl + "/api/books");
 }

 //Update the Record
 this.put = function (Id, Book) {
 var request = $http({
 method: "put",
 url: baseUrl + "/api/books/" + Id,
 data: Book
 });
 return request;
 }

 //Delete the Record
 this.delete = function (Id) {
 var request = $http({
 method: "delete",
 url: baseUrl + "/api/books/" + Id
 });
 return request;
 }
});
```

We are defining the functions (they are actually called "promises") here. Each of these functions handles a CRUD operation and points an end point. By putting these functions inside the service we are separating the concerns from the controller. We can later inject this service in to the controller. Have a read here <a href="https://www.sitepoint.com/tidy-angular-controllers-factories-services/" target="_blank">https://www.sitepoint.com/tidy-angular-controllers-factories-services/</a>.


#### Controller.js


```javascript
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
 console.log("Err" + error);
 });
 } else { //Else Edit the record
 var promisePut = crudService.put($scope.BookId, Book);
 promisePut.then(function (result) {
 $scope.status = "Updated Successfuly";
 $scope.statusClass = 'label-success';
 loadAllBooks();
 }, function (error) {
 $scope.status = 'Error: ' + error;
 $scope.statusClass = 'label-warning';
 console.log("Err" + error);
 });
 }

 }

 //Method to Delete
 $scope.delete = function () {
 var promiseDelete = crudService.delete($scope.BookId);
 promiseDelete.then(function (result) {
 $scope.status = "Deleted Successfuly";
 $scope.statusClass = 'label-success';
 $scope.BookId = 0;
 $scope.BookName = "";
 $scope.BookAuthor = "";

 loadAllBooks();
 }, function (error) {
 $scope.status = 'Error: ' + error;
 $scope.statusClass = 'label-warning';
 console.log("Err" + error);
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
 $scope.status = "";
 $scope.IsNewRecord = 1;
 $scope.BookId = 0;
 $scope.BookName = "";
 $scope.BookAuthor = "";
 }

}).directive('myBooktableheader', function () {
 return {
 templateUrl: 'http://localhost:51836/BookTemplate.html'
 };
});
```

Here we have the controller that coordinates everything. As we discussed earlier notice how the crudService is injected in. Dependency Injection is a major part of how Angular works. Read more here <a href="https://docs.angularjs.org/guide/di" target="_blank">https://docs.angularjs.org/guide/di</a>.

Everything here is pretty straight forward. We just created methods to load and save books. We have some fields in the scope that we use to bind the input fields to ($scope.BookId, BookName, BookAuthor). Read more here <a href="https://www.w3schools.com/angular/angular_databinding.asp" target="_blank">https://www.w3schools.com/angular/angular_databinding.asp</a>.

To demonstrate directives, I have also added a custom directive definition right at the end of the controller which has an external template.


#### BookTemplate.html


```javascript
<th>Id</th>
<th>Name</th>
<th>Author</th>
<th></th>
```

Directives are a big topic onto itself. We are covering the very basic use here for a trivial example. Read more about directives here <a href="https://docs.angularjs.org/guide/directive" target="_blank">https://docs.angularjs.org/guide/directive</a>.


#### Book.cshtml (partial code example)


See full code at <a href="https://github.com/dasiths/AngularJsWebApiTest/blob/master/AngularWebApplication/Views/Book/Index.cshtml" target="_blank">https://github.com/dasiths/AngularJsWebApiTest/blob/master/AngularWebApplication/Views/Book/Index.cshtml</a>.

```html
<body ng-controller="BookListController">
<div class="body-content">
<h3>@ViewData["Message"]</h3>
<table>
<tr>
<td>
<table id="searchObjResults" class="table-striped table-hover" width="600">
<tr my-Booktableheader></tr>
<tr ng-repeat="book in Books | filter:search:strict">
<td>{{book.id}}</td>
<td>{{book.name}}</td>
<td>{{book.author}}</td>
<td>
 <button type="button" class="btn" ng-click="get(book)">
 <span class="glyphicon glyphicon-edit"></span>
 </button></td>
</tr>
... see github for repo for full code

 <label ng-class="statusClass">Status: {{status}}</label>

Use this area to filter results.

 <label>Any: <input ng-model="search.$"></label>

 <label>Name only <input ng-model="search.name"></label>

 <label>Author only <input ng-model="search.author"></label>

 <label>Equality <input type="checkbox" ng-model="strict"></label>

```

This will be our template for the main web page. Take note of how we use data binding using one-way and two-way data binding directives. More here <a href="https://www.w3schools.com/angular/angular_databinding.asp" target="_blank">https://www.w3schools.com/angular/angular_databinding.asp</a>.

The other thing to note here is the filtering. We have some typical examples of filter use covered in the example. Read more about filters here <a href="https://www.w3schools.com/angular/angular_filters.asp" target="_blank">https://www.w3schools.com/angular/angular_filters.asp</a>.

Well that's it for the Client side of the application. Now let's quickly look at the WebAPI end point.

I'm using Visual Studio 2017 to create my project. I created a project using the ASP.NET CORE web api template.


#### BookRepository.cs


```csharp
 public class BookRepository
 {
 private List<Book> _books = new List<Book>();
 public BookRepository()
 {
 _books.Add(new Book() { Id = 1, Name = "P=NP in .NET", Author = "Jon Skeet" });
 _books.Add(new Book() { Id = 2, Name = "Dank Memes", Author = "Dasith Wijes" });
 _books.Add(new Book() { Id = 3, Name = "50 'Shards' of Azure SQL", Author = "Actor Model" });
 _books.Add(new Book() { Id = 4, Name = "Jailbreaking iOS to Set a Default Web Browser", Author = "Cult Of Fandroid" });
 _books.Add(new Book() { Id = 5, Name = "OCD Olympics", Author = "Also Me" });
 }

 public IEnumerable<Book> GetAllBooks()
 {
 return _books.ToArray();
 }

 public void UpdateBook(Book b)
 {
 _books[_books.IndexOf(_books.Single(o => o.Id == b.Id))] = b;
 }

 public int AddBook(Book b)
 {
 b.Id = _books.Max(o=> o.Id) + 1;
 _books.Add(b);

 return b.Id;
 }

 public void DeleteBook(int id)
 {
 _books.Remove(_books.Single(o => o.Id == id));
 }
 }
```


#### Startup.cs


I **enabled CORS** as follows in startup.cs because our Angular app will be communicating from a different "host". (The angular app runs as a separate application on a separate port to the webapi.) Also I added the repository as a singleton to the IOC container.

```csharp
public class Startup
{
	public Startup(IHostingEnvironment env)
	{
		var builder = new ConfigurationBuilder()
		.SetBasePath(env.ContentRootPath)
		.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
		.AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
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
		services.AddSingleton<Repository.BookRepository>();
	}

	// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
	public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
	{
		loggerFactory.AddConsole(Configuration.GetSection("Logging"));
		loggerFactory.AddDebug();

		app.UseCors(builder => builder.WithOrigins("*")
		.AllowAnyOrigin()
		.AllowAnyMethod()
		.AllowAnyHeader());

		app.UseMvc();
	}
}
```


####  BookController.cs


This is your stock standard web api controller. I've put some effort into wrapping my results with the proper http status codes and handling some errors. This is by no means perfect but just note how the web api communicates back via both the status code and content.

```csharp
public class BooksController: Controller {

 BookRepository _repo;

 public BooksController(BookRepository repo) {
  _repo = repo;
 }

 // GET api/books
 [HttpGet]
 public IActionResult Get() {
  var result = _repo.GetAllBooks();

  if (result.Count() > 0)
   return Ok(result);
  else
   return NoContent();
 }

 // GET api/books/id
 [HttpGet("{id}")]
 public IActionResult Get(int id) {
  var result = _repo.GetAllBooks().SingleOrDefault(o => o.Id == id);

  if (result == null)
   return NoContent();
  else
   return Ok(result);
 }

 // GET api/books/q=query
 [HttpGet("q={name}")]
 public IActionResult Get(string name) {
  var results = _repo.GetAllBooks().Where(
   o => o.Name.IndexOf(name, 0, StringComparison.OrdinalIgnoreCase) >= 0);

  if (results.Count() > 0) {
   return Ok(results);
  } else {
   return NoContent();
  }

 }

 // POST api/books
 [HttpPost]
 public IActionResult Post([FromBody] Book b) {
  if (ModelState.IsValid == false)
   return BadRequest();

  try {
   return Ok(_repo.AddBook(b));
  } catch (Exception ex) {
   return BadRequest(ex.Message);
  }

 }

 // PUT api/books/id
 [HttpPut("{id}")]
 public IActionResult Put(int id, [FromBody] Book b) {

  if (ModelState.IsValid == false || id != b.Id)
   return BadRequest();

  var result = _repo.GetAllBooks().SingleOrDefault(o => o.Id == id);
  if (result == null)
   return NotFound();

  try {
   _repo.UpdateBook(b);
   return Ok(id);
  } catch (Exception ex) {
   return BadRequest(ex.Message);
  }
 }

 // DELETE api/books/id
 [HttpDelete("{id}")]
 public IActionResult Delete(int id) {
  try {
   _repo.DeleteBook(id);
   return Ok(id);
  } catch (Exception ex) {
   return BadRequest(ex.Message);
  }
 }

}
```

That's it. We have covered the major components in the project. Run it and see if you can have a play with it.

![AngularWebAPI](/assets/images/angularwebapi.png)

Good luck with your learning. I recommend you learn more about a topic like <a href="http://www.c-sharpcorner.com/UploadFile/ff2f08/token-based-authentication-using-Asp-Net-web-api-in-angularj/" target="_blank">token authentication using Angular + webapi</a> because it will be something you will end up doing often. Another important area we didn't cover here is <a href="https://scotch.io/tutorials/angularjs-multi-step-form-using-ui-router" target="_blank">routing</a>.

Please post your comments and ideas here as they help me improve my knowledge and blogging skills. Thank you.
