---
title: "Integration Testing an AspNet Core API That is Protected With CSRF/XSRF Tokens"
date: 2020-02-03 12:00
header:
  teaser: /assets/images/photo-1532678312818-7c8cfdfe5491.jpg
comments: true
categories: [.net, aspnet core, testing]
tags: [.net, aspnet core, testing, tokens, csrf]
---

I was working on writing integrations tests for an AspNet Core Web API project recently ([I blogged about how to write integration tests here](https://dasith.me/2018/12/30/integration-testing-aspnet-core-webapi/)). The front end was developed using Angular and we had CSRF protection enabled.

If you haven't done this before, the [Microsoft documentation](https://docs.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-3.1) is a good place to start.

## How It Works

On the first request to the server, it returns a `cookie` with a special name (i.e. `XSRF-TOKEN`). The SPA is expected to extract the value from the cookie and reattach that in the subsequent request's header (i.e. as `X-XSRF-TOKEN`). Each time you make a request you get a new token and that token is only valid for the subsequent request. This way the server prevents CSRF attacks.

SPA frameworks like Angular have built in interceptor mechanisms in place which makes it easier to do this extraction and re-attaching process automatically [as described here](https://angular.io/guide/security#xsrf).

## The Problem

When you want to do integration testing of a protected endpoint, there is no SPA framework to do the above extraction automatically (Unless you write full end to end tests).

So you have to simulate this process yourself by...  

1. Making a call to a known open endpoint
1. Extracting the token from the cookies returned
1. Attaching the token to a header of the next request

There is one more important thing that the browser does automatically as well. It extracts any cookie from the server response headers and attaches them to the next request. This has nothing to do with CSRF, but as I found out the [ASPNet Core CSRF implementation requires the cookies to be present](https://github.com/aspnet/Antiforgery/blob/8124442320b6de41a89bd779dd1b82b5bb8131e7/src/Microsoft.AspNetCore.Antiforgery/Internal/DefaultAntiforgery.cs#L115) for the validation to succeed. Hence this is another thing we need to simulate.

## Solution

First let's have a look at how I enabled CSRF token validation in AspNet Core.

In my `Startup.cs`

```c#
    public void ConfigureServices(IServiceCollection services)
    {
        // other service registrations will go here

        services.AddMvc(options =>
            {
                options.Filters.Add<AutoValidateAntiforgeryTokenAttribute>(); 
                // See https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.mvc.autovalidateantiforgerytokenattribute
            })
            .SetCompatibilityVersion(CompatibilityVersion.Version_2_2)
            .AddApplicationPart(typeof(Startup).Assembly);

        services.AddAntiforgery(options =>
            {
                options.HeaderName = CsrfMiddleWare.XsrfTokenHeaderName;
                // We define the header name here. Default is "X-XSRF-TOKEN"
            });
    }

    public void Configure(IApplicationBuilder app)
    {
        app.UseMiddleware<CsrfMiddleWare>(); // Make sure to put this before the MVC middleware

        // Examples of things that might go below the CSRF middleware
        app.UseStaticFiles();
        app.UseSpaStaticFiles();
        app.UseMvc(routes =>
        {
            routes.MapRoute(
                name: "default",
                template: "{controller}/{action=Index}/{id?}");
        });
    }
```

Then define your CSRF middleware.

```c#
    public class CsrfMiddleWare
    {
        public const string XsrfTokenHeaderName = "MY-XSRF-TOKEN";
        public const string XsrfCookieName = "MY-XSRF-TOKEN";

        private readonly RequestDelegate _next;
        private readonly IAntiforgery _antiforgery;

        public CsrfMiddleWare(RequestDelegate next, IAntiforgery antiforgery)
        {
            _next = next ?? throw new ArgumentNullException(nameof(next));
            _antiforgery = antiforgery;
        }

        public async Task Invoke(HttpContext context)
        {
            var tokens = _antiforgery.GetAndStoreTokens(context);
            context.Response.Cookies.Append(XsrfCookieName,
                tokens.RequestToken,
                new CookieOptions()
                {
                    HttpOnly = false,
                    SameSite = SameSiteMode.Strict
                });

            await _next.Invoke(context);
        }
    }
```

That should now protect your endpoints that are using `POST`, `PUT`, `DELETE` HTTP verbs. Time to write some integration tests.

You start of creating an endpoint that doesn't require CSRF protection (i.e. `GET`). This will function as our first request target which initiates the CSRF token creation process.

```c#
    [Route("api/[controller]")]
    public class TestController: Controller
    {
        /*
        * This endpoint is used for integration tests to generate the CSRF token
        */

        public IActionResult Get()
        {
            return Ok();
        }
    }
```

We then create the `WebApplicationFactory` to use in our integration tests. You can read more about it in my [previous post](https://dasith.me/2018/12/30/integration-testing-aspnet-core-webapi/) if you're not familiar with it already.

```c#
    public class WebAppFactory : WebApplicationFactory<Startup>
    {
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
                // Setup your mocks here
            });
        }
    }
```

Now let's create a convenience method to retrieve a CSRF token. When we make the initial call, we get a couple of cookies returned in the `Set-Cookie` response header. One of them (`MY-XSRF-TOKEN`) is the CSRF token. We extract that and then attach it to the subsequent request as a header with the name `MY-XSRF-TOKEN`. We also attach the two cookies back to the next request as well. **This simulates the behaviour of a web browser and the Angular SPA CSRF interceptor.**

I highly recommend you debug and step through the method below to get a good understanding of what it received, extracted and re-attached to the next request.

I haven't put any effort to clean up the code below. It's meant for demo purposes only.

```c#
    public static async Task<HttpClient> GetCsrfAwareClientAsync(this WebAppFactory factory)
    {
        const string cookieName = CsrfMiddleWare.XsrfCookieName;
        const string headerName = CsrfMiddleWare.XsrfTokenHeader;

        var client = factory.CreateClient();
        var testResult = await client.GetAsync("/api/test"); // the endpoint we created before
        var cookies = testResult.Headers.GetValues("Set-Cookie").ToList();

        var token = cookies.Single(x => x.StartsWith(cookieName))?.Substring($"{cookieName}=".Length).Split(";")[0];

        // We need to append both the cookie and the header as both are checked
        // https://github.com/aspnet/Antiforgery/blob/8124442320b6de41a89bd779dd1b82b5bb8131e7/src/Microsoft.AspNetCore.Antiforgery/Internal/DefaultAntiforgery.cs#L115

        client.DefaultRequestHeaders.Clear();
        client.DefaultRequestHeaders.Add(headerName, new[] { token }); // attach CSRF tokens
        client.DefaultRequestHeaders.Add("Cookie", cookies); // attach cookies
        return client;
    }
```

Using the `GetCsrfAwareClientAsync()` convenience method, you can easily keep the CSRF logic compartmentalized and focus on business logic when writing the integration tests.

```c#
    [Fact]
    public async Task CsrfTokenWorked()
    {
        // Arrange
        var factory = new WebAppFactory();
        var client = await factory.GetCsrfAwareClientAsync();
        var order = new CreateOrderModel("Order name", "Customer");

        // Act
        var response = await client
            .PostAsJsonAsync("/Api/Orders/Create", order);

        // Assert
        response.EnsureSuccessStatusCode();
    }
```

*Note: There is a [much nicer way to handle cookie extraction](https://stackoverflow.com/questions/12373738/how-do-i-set-a-cookie-on-httpclients-httprequestmessage) using something called a [`CookieContainer`](https://docs.microsoft.com/en-us/dotnet/api/system.net.cookiecontainer?view=netstandard-2.1) but we can't use it in our examples because the `HttpClient` is constructed for us via the `WebApplicationFactory.CreateClient()` and we don't have access to the ClientHandler underneath to hook our own CookieContainer.*

## Conclusion

CSRF protection is a must have when you are developing a web application that uses any form of cookie based authentication. But it makes it a bit harder to test as a result. This post showed you how to simulate the initial call to an open endpoint and simulate the browser/SPA behaviour when it comes to handing cookies in the response header.

I hope this has been helpful and saves you some time researching what's required to write an integration test when CSRF is in the picture.

Please leave any comments or feedback. Thank you.
