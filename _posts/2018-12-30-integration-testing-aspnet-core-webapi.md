---
title: "Integration Testing ASP.NET Core WebApi"
date: 2018-12-30 23:02
header:
  teaser: /assets/images/connect-20333_640.jpg
comments: true
categories: [asp.net core, testing]
tags: [asp.net core, webapi, testing, mocking]
---

If you're a decent .NET developer and lucky enough to work in a good team then most of your work would be unit testable. But there is always a case to write some integration tests to make sure things work end to end.

I was in such a situation recently. I had to write integration tests for a ASP.NET core 2.2 project which had external dependencies I had to mock during the test. The Microsoft [documentation](https://docs.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-2.2) was very good but it doesn't (at the time of writting this post) cover all scenarios when mocking is required.

## Setup

1. My `Startup.cs` file on the project under test was nothing out of the ordinary. Here it is for reference.

    ```csharp
    public class Startup
    {
        public Startup(IHostingEnvironment env)
        {
            Configuration = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile(path: "appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile(path: $"appsettings.{env.EnvironmentName}.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables()
                .Build();

            // I used serilog for logging. Omitted the code from here.

            HostingEnvironment = env;

            Log.Information("Starting web host");
        }

        public IConfiguration Configuration { get; }
        public IHostingEnvironment HostingEnvironment { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public virtual void ConfigureServices(IServiceCollection services)
        {
            services.AddSingleton(Configuration);
            services.AddHttpsRedirection(options =>
            {
                options.HttpsPort = 443;
                options.RedirectStatusCode = StatusCodes.Status301MovedPermanently;
            });

            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_1);

            // Custom dependencies via extention method
            services.AddCustomServices();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public virtual void Configure(IApplicationBuilder app,
            IHostingEnvironment env,
            IApplicationLifetime applicationLifetime,
            ILoggerFactory loggerFactory)
        {
            loggerFactory.AddSerilog();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseHttpsRedirection();
            }

            app.UseMvc();
        }
    }
    ```

    *Just to be clear. You don't need a seperate `Startup.cs` file in your integration test project. The one above is from the webapi project under test.*

2. Let's start creating the integration test project now. First, add the following references to your test project. I'm using `xunit` and `FluentAssertions` for my tests but feel free to choose your own.

    ```xml
        <PackageReference Include="Microsoft.AspNetCore.App" Version="2.1.1" />
        <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="2.1.1" />
        <PackageReference Include="FluentAssertions" Version="5.5.3" />
        <PackageReference Include="xunit" Version="2.4.1" />
        <PackageReference Include="xunit.runner.visualstudio" Version="2.4.1">
        <PrivateAssets>all</PrivateAssets>
        <IncludeAssets>runtime; build; native; contentfiles; analyzers</IncludeAssets>
        </PackageReference>
    ```

3. Now add a `appsettings.json` file to the root of the project and set it to **copy to the output directory**. Your `*.csproj` should now have an entry like below.

    ```xml
        <Content Include="appsettings.json">
        <CopyToPublishDirectory>PreserveNewest</CopyToPublishDirectory>
        <CopyToOutputDirectory>Always</CopyToOutputDirectory>
        </Content>
    ```

    This `appsettings.json` file will contain the integration test specific configuration settings.

4. We require a web application factory to host an instance of the web application. Let's create that.
    ```csharp
    public class WebAppFactory : WebApplicationFactory<Startup>
    {
        private readonly Action<IServiceCollection> _configureTestServices;

        public WebAppFactory(Action<IServiceCollection> configureTestServices)
        {
            _configureTestServices = configureTestServices;
        }

        protected override IWebHostBuilder CreateWebHostBuilder()
        {
            return WebHost.CreateDefaultBuilder()
                .UseStartup<Startup>();
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseContentRoot(".");
            base.ConfigureWebHost(builder);

            builder.ConfigureTestServices(collection =>
            {
                _configureTestServices?.Invoke(collection);
            });
        }
    }
    ```

    Notice how we are passing an action as a parameter in the constructor. This action gets used in the `ConfigureTestServices()` method when we build the host.

    The builder will honor our `Startup.cs` class and its `ConfigureServices()` method and run it first. Then the `ConfigureTestServices()` will be called which gives us a chance to **override any registrations with our mocks.**

    The `builder.UseContentRoot(".")` also tells the factory to use the current projects build/runing path as the root. Which is used to read our custom `appsettings.json` file.

    **Important:** The reason why I passed the action in the constructor was to give each test the chance to setup the mock when instatiating the host, and not have a global or staticly configured mock. I'm using an instance of the host per test and **not** using the `IClassFixture<T>` as shown in the [documenation](https://docs.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-2.2#basic-tests-with-the-default-webapplicationfactory). If you decide to have an instance of the host per test class then you should configure your mocks differently. Choose what's right for you in your scenario. Drop a message here in the comments if you get stuck.

5. Mocking

    I have an external downstream api/service which needs to be mocked. Let's assume the service we need to mock is called `IServiceClient`. My mock class would look like below.

    ```csharp
        public class MockedServiceClient: IServiceClient
        {
            private readonly Func<HttpRequestMessage, HttpResponseMessage> _mockFunc;

            public MockedServiceClient(Func<HttpRequestMessage, HttpResponseMessage> mockFunc)
            {
                _mockFunc = mockFunc;
            }

            public async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request)
            {
                return _mockFunc(request);
            }
        }
    ```
    My example just executes the functions passed in the constructor. Simple. You can write your mock to always return the same value or have some conditional logic. Up to you.

6. Testing

   Testing the controllers is now a simple task. We just need to instantiate the factory and create a http client to make the calls.

    ```csharp
    public class OperationsControllerTests : IDisposable
    {
        private readonly WebAppFactory _webAppFactory;
        private readonly HttpClient _httpClient;
        private Func<HttpRequestMessage, HttpResponseMessage> _mockFunc;

        public OperationsControllerTests()
        {
            _webAppFactory = new WebAppFactory(collection =>
            {
                var client = new MockedServiceClient(message => _mockFunc(message));
                collection.AddSingleton<IServiceClient>(client);
            });
            _httpClient = _webAppFactory.CreateClient();
        }

        [Fact]
        public async Task EchoEndPointReturns200()
        {
            var result = await _httpClient.GetAsync("/Operations/echo");
            result.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task SearchReturnsSuccessResultWhenQueryIsPassed()
        {
            // Result to return from mock
            var searchResults = new[]
            {
                new SearchResult()
                {
                    ResponseContent = string.Empty
                }
            };

            _mockFunc = message =>
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonConvert.SerializeObject(searchResults), Encoding.UTF8,
                        "application/json")
                };
            };

            var result = await _httpClient.GetAsync("/Operations/search?query=test");
            result.StatusCode.Should().Be(HttpStatusCode.OK);

            var jsonResult = await result.Content.ReadAsStringAsync();

            var resultObject = JsonConvert.DeserializeObject<SearchResponse>(jsonResult);
            resultObject.SearchResults.Length.Should().Be(1);
        }

        public void Dispose()
        {
            _webAppFactory.Dispose();
        }
    }
    ```

Yes it's really that simple. One more thing. I had some trouble with the AzureDevOps hosted agents running the integration tests until I added a `xunit.runner.json` to the root of the project with the following content.

```json
{
  "shadowCopy": false
}
```

I hope this helps you get started on bootstrapping an integration test for your ASP.NET webapi project. Please let me know your thoughts and criticism in the comments section below. Thank your for your time.

## Update 20/02/20

I wrote the example for AspNetCore 2.0+. AspNet Core 3.0 uses the `HostBuilder` instead of the `WebHostBuilder` to create the web host. If you're using the examples for an AspNetCore 3+ project you might want to consider this advice https://andrewlock.net/converting-integration-tests-to-net-core-3/#using-webapplicationfactory-in-asp-net-core-3-0 and override the `CreatHostBuilder()` instead of the `CreateWebHostBuilder()` in my example.
