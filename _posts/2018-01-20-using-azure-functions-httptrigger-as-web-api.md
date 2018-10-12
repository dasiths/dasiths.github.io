---
title: "Using Azure Functions HttpTrigger As Web API"
date: 2018-01-20 18:39
comments: true
categories: [serverless, web api]
tags: [azure functions, serverless, webapi]
header:
  teaser: /assets/images/azure_functions_featured_image.png
  image: /assets/images/azure_functions_featured_image.png
---
If you haven't lived under a rock for the last 18 months you would know 'Serverless' is the new cool kid in town. Microsoft's offer is called Azure Functions while Amazon calls it AWS Lambda.

I won't go into the various pros and cons of a serverless application in this blog post. There have been various posts written about the nuances of serverless you can Google for. I recommend having a read of Martin Fowler's <a href="https://martinfowler.com/articles/serverless.html" target="_blank" rel="noopener">post here</a>.


### Some Context


I recently worked on a project at Readify that was a POC (proof of concept) mobile app in a team of 4 people. We used Ionic for the app and Azure Functions was chosen for implement the back end web API. We didn't have a lot of surface area to expose through the API so spinning up an app service with a hosted ASP.NET WebApi project wasn't deemed necessary. We decided to have the mobile app talk directly to the Azure Function API endpoints. We deliberated on using API Management but ultimately decided not to since it was a POC project with limited scope.


### Reasons For Our Technology Choices


- **Ionic** 

	(I should do another blog post about the 'fun' we had setting up CI/CD using Cordova/Ionic + MacInCloud + HockeyApp)
	We had 10 weeks to develop the app and the client wanted it to be cross platform. We could have gone with a progressive web app but push notifications on iOS wouldn't have been possible.
	
- **Serverless**

	We had a lot of back end integration pieces that were triggered by certain events. This was a natural fit for what a consumption model of a serverless function provides. Azure functions were chosen because of the team's experience with it.
	
- **Http Triggered Azure Function As Web API**

    This was perhaps the most contentious choice. We could have easily gone with a full ASP.Net WebApi solution but since this was a POC app and we wanted to see if we could utilize the same consumption model for the API as well. A decision was made to separate the core part of the project as a class library (We used a command/query dispatcher pattern), so pivoting to a asp.net web api project wasn't hard if required further down the line.
	
*   **API Management**

    We initially started with API Management provisioned in Azure but quickly found out that we can't have it emulated locally so things like the CORS (Cross Origin Resource Sharing) functionality or authentication would not be possible to test if wanted to have the app test/debug against the azure functions running locally. This threw a big wrench in our plans. API management wasn't cheap either. It didn't fit with the consumption based costing model we were going with. So we decided to drop it and implement CORS and authentication ourselves.


### How Did We Implement The API?


An <del>Azure Function</del> serverless function needs to be very lightweight. We were very careful not to introduce unnecessary complexity.


*   Most requests coming through had a JWT bearer token so we needed a way to decode and construct a proper claims principal. If there was anything wrong with the JWT (ie wrong 'audience' or 'scope') we would throw a 401 response.
*   **All requests** needed to support CORS.
The http request needed to go through a layer that handles authentication and another that handles CORS. In an ASP.Net WebAPI application this is handled through the <a href="https://www.codeproject.com/Articles/864725/ASP-NET-Understanding-OWIN-Katana-and-the-Middlewa" target="_blank" rel="noopener">OWIN pipeline</a>. The Auth and CORS middleware inspects and handles the request appropriately and sets the HttpContext accordingly.

It's a simple enough pattern to follow so we designed our middleware interface based on OWIN.

```csharp
namespace Functions.Infrastructure
{
    public abstract class HttpMiddleware
    {
        public HttpMiddleware Next;

        protected HttpMiddleware(HttpMiddleware next)
        {
            this.Next = next;
        }

        protected HttpMiddleware()
        {

        }

        public abstract Task InvokeAsync(IHttpFunctionContext context);
    }
}
```

It's a simple pattern that works like the russian <a href="https://en.wikipedia.org/wiki/Matryoshka_doll" target="_blank" rel="noopener">Matryoshka dolls</a>. Each middleware has the chance to create/augment the response and decide whether or not to call the next middleware. You get a chance to modify the response before and after invoking the next middleware in the pipeline.

We don't have a HttpContext to work with like we do in WebApi so we rolled out our own.

```csharp
namespace Functions.Infrastructure
{
    public interface IHttpFunctionContext
    {
        HttpRequestMessage Request { get; }
        HttpResponseMessage Response { get; set; }
        ILogger Logger { get; }
        IUser User { get; set; }
    }
}
```

`IUser` is just a ClaimsPrincipal. We could have set the *Thread.CurrentPrincipal* as well but <a href="https://davidpine.net/blog/principal-architecture-changes/" target="_blank" rel="noopener">.NET core doesn't seem to set it anyway in WebAPI</a>. So why bother right? So far so good.

Just for completeness sake here is the interface and implementation we used to create the pipeline.

```csharp
namespace Functions.Infrastructure
{
    public interface IMiddlewarePipeline
    {
        void Register(HttpMiddleware middleware);
        Task<HttpResponseMessage> ExecuteAsync(IHttpFunctionContext context);
    }

    public class MiddlewarePipeline : IMiddlewarePipeline
    {
        private readonly List<HttpMiddleware> _pipeline;

        public MiddlewarePipeline(List<HttpMiddleware> pipeline)
        {
            _pipeline = new List<HttpMiddleware>();

            foreach (var httpMiddleware in pipeline)
            {
                Register(httpMiddleware);
            }
        }

        public void Register(HttpMiddleware middleware)
        {
            if (_pipeline.Any())
            {
                _pipeline[_pipeline.Count - 1].Next = middleware;
            }

            _pipeline.Add(middleware);
        }

        public async Task<HttpResponseMessage> ExecuteAsync(IHttpFunctionContext context)
        {
            try
            {
                if (_pipeline.Any())
                {
                    await _pipeline[0].InvokeAsync(context);

                    if (context.Response != null)
                    {
                        return context.Response;
                    }
                }

                throw new MiddlewarePipelineException();
            }
            catch (Exception e)
            {
                context.Logger.Error(e.Message, e);
                return context.Request.CreateErrorResponse(HttpStatusCode.InternalServerError, e);
            }
        }
    }
}
```

We just *Register()* the middleware we want and call the *ExecuteAsync()* with the *FunctionContext*. Couldn't be any more simpler right? :)


### CORS


Let's look at an example of how we would implement CORS using our middleware now. I've allowed any origin here by using *. Use an appropriate value that works for you. (**The CORS feature pane in your Azure Function settings might need an entry with just a * as well**. The online guidance for this isn't very clear. We found that putting one entry with a * worked for us)

```csharp
namespace Functions.Infrastructure.Middleware
{
    public class CorsMiddleware : HttpMiddleware
    {
        private readonly string _allowedVerbs;

        public CorsMiddleware(string allowedVerbs) : base()
        {
            _allowedVerbs = allowedVerbs;
        }

        public override async Task InvokeAsync(IHttpFunctionContext context)
        {
            var response = context.Request.GetCorsResponse(_allowedVerbs);

            if (response == null)
            {
                await this.Next.InvokeAsync(context);

                if (context.Response != null)
                {
                    context.Response = context.Response.EnrichWithCorsOrigin();
                }
            }
            else
            {
                context.Response = response;
            }
        }
    }

    public static class CorsExtensions
    {
        public static HttpResponseMessage GetCorsResponse(this HttpRequestMessage req, string allowedHttpVerbs)
        {
            if (req.Method.Method.ToUpper() == "OPTIONS")
            {
                var response = req.CreateResponse(HttpStatusCode.OK, "Hello from the other side");

                if (req.Headers.Contains("Origin"))
                {
                    response.Headers.Add("Access-Control-Allow-Credentials", "true");
                    response.Headers.Add("Access-Control-Allow-Origin", "*");
                    response.Headers.Add("Access-Control-Allow-Methods", allowedHttpVerbs.ToUpper());
                    response.Headers.Add("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Your-Own-Header-Here");
                }

                return response;
            }

            return null;
        }

        public static HttpResponseMessage EnrichWithCorsOrigin(this HttpResponseMessage response)
        {
            response.Headers.Add("Access-Control-Allow-Origin", "*");
            return response;
        }
    }
}
```


### JWT Bearer Token Authentication


Here is an simple example of how you could do bearer token authentication using this middleware concept. We used <a href="https://github.com/jwt-dotnet/jwt" target="_blank" rel="noopener">JWT.NET</a> to implement JWT bearer tokens authentication in our *TokenValidator* class. I won't include that code here as it is out of scope. Leave a comment here or email me if you get stuck implementing it.

```csharp
namespace Functions.Infrastructure.Middleware
{
    public class SecurityMiddleware : HttpMiddleware
    {
        private readonly bool _mustBeAuthenticated;
        private readonly ITokenValidator _tokenValidator;

        public SecurityMiddleware(bool mustBeAuthenticated, ITokenValidator tokenValidator)
        {
            _mustBeAuthenticated = mustBeAuthenticated;
            _tokenValidator = tokenValidator;
        }

        public override async Task InvokeAsync(IHttpFunctionContext context)
        {
            var req = context.Request;
            var log = context.Logger;

            var header = req.Headers
                .FirstOrDefault(q =>
                    q.Key.Equals("Authorization") && q.Value.FirstOrDefault() != null);

            string bearerToken = header.Value == null ? string.Empty : header.Value.FirstOrDefault()?.Substring("Bearer ".Length).Trim(); ;

            if (string.IsNullOrWhiteSpace(bearerToken))
            {
                log.Warning("No bearer token provided");

                if (_mustBeAuthenticated)
                {
                    context.Response = req.CreateErrorResponse(HttpStatusCode.BadRequest, "Bearer token can't be empty");
                    return;
                }

            }
            else
            {
                context.User =  await _tokenValidator.ConstructPrincipal(bearerToken);
            }

            if (Next != null)
            {
                await Next.InvokeAsync(context);
            }
        }
    }
}
```

I agree it is a fair bit of boilerplate but hang in there with me. :) We will get more into this topic of boilerplate in my learnings section of this post.


### We've got Auth and CORS working but where is the middleware that actually does the handling of the API call?


Here is an example from an API call that returns the current odometer reading for a car based on a registration number in the JWT claims. Notice how we are assuming the Context.User will be populated? That's because of the authentication middleware we used before. Is it all starting to make sense now?

```csharp
public class OdometerHandler : HttpMiddleware
    {
        private readonly IGetOdometerUsingRegoQuery _getOdometerUsingRegoQuery;

        public OdometerHandler(IGetOdometerUsingRegoQuery getOdometerUsingRegoQuery)
        {
            _getOdometerUsingRegoQuery = getOdometerUsingRegoQuery;
        }

        public override async Task InvokeAsync(IHttpFunctionContext context)
        {
            var req = context.Request;
            var log = context.Logger;

            log.Info($"Odometer request received for rego:  '{context.User.Rego}'");
            var odometerDto = await _getOdometerUsingRegoQuery.ExecuteAsync(context.User.Rego);

            if (odometerDto == null)
            {
                context.Response = req.CreateResponse(HttpStatusCode.NoContent);
            }
            else
            {
                context.Response = req.CreateResponse(HttpStatusCode.OK, odometerDto);
            }

        }
    }
```

This is how we wired it all up. The *Ioc.Bootstrap()* method doesn't do anything fancy. It just creates the required middleware instances and the FunctionContext with Request and Logger attached. Just like with OWIN, the order of middleware matters. Note how we allow the **OPTIONS** http verb because we want it handled within the function logic in our CORS middleware. Leave a comment here if you get stuck and need assistance.

```csharp
namespace Functions
{
    public static class OdometerReading
    {
        [FunctionName("OdometerReading")]
        public static async Task<HttpResponseMessage> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "GET", "OPTIONS")]HttpRequestMessage req,
            TraceWriter log)
        {
            using (var container = Ioc.Bootstrap(req, log))
            {
                var odometerHandler = container.Resolve<OdometerHandler>();
                var corsMiddleware = container.Resolve<CorsMiddleware>(
                    new NamedParameter("allowedVerbs", "GET, OPTIONS"));
                var securityMiddleware = container.Resolve<SecurityMiddleware>();
                var errorTranslator = container.Resolve<ErrorTranslateMiddleware>();

                IHttpFunctionContext context = container.Resolve<IHttpFunctionContext>();

                var pipeline = container.Resolve<IMiddlewarePipeline>(
                    new NamedParameter("pipeline",
                    new List<HttpMiddleware>(){
                      corsMiddleware,
                      errorTranslator,
                      securityMiddleware,
                      odometerHandler
                }));

                return await pipeline.Execute(context);
            }
        }
    }
}
```

<hr />



### Our Learnings & Was All That Worth The Effort?


That is the million dollar question. After all we could have gone with ASP.NET WebApi and got most of the boilerplate out of the box. Yes I do mean IOC here as well.

**We wanted to challenge ourselves to see if we could do this POC app using a pay for consumption model**. AppService hosted WebApi doesn't fit that mould entirely. Nor does Azure Api Management yet. This biggest issue with API Management though is that tooling isn't there for developers to emulate it when running your azure function locally against the mobile/web app. For a project that has many API endpoints, there is no easy way to setup API management easily. (ie We can use Swashbuckle when using ASP.NET WebApi to get a swagger file and import in API management but no such feature exists for Azure Functions http triggers).


### What about AWS Lambda?


AWS Lambda supports <a href="https://aws.amazon.com/blogs/developer/deploy-an-existing-asp-net-core-web-api-to-aws-lambda/" target="_blank" rel="noopener">hosting ASP.NET WebApi projects as a severless app</a>. I haven't used this feature before but we would have chosen that option if it were available for us in Azure Functions. It solves the problem of boilerplate. It's also interesting to note that at the time of development of this app Azure Functions didn't support .NET core but Lambda did.

<hr />

### Conclusions (Confused?)


Don't be. We went with the approach of serverless consumption model first but ended up having to implement our own OWIN like middleware and do auth and CORS our selves. It didn't add any significant startup or performance cost to the app but if the project boilerplate was any larger it could have.

Before you start to implement a web api using Azure Functions http triggers consider the following


*   **Do you need authentication and authorization?**
	If you have a lot of bespoke requirements around this I would recommend going with ASP.NET WebApi as it is more mature and has the boilerplate to handle them. Azure Functions can be <a href="https://contos.io/working-with-identity-in-an-azure-function-1a981e10b900" target="_blank" rel="noopener">secured using Azure AD</a> but I haven't used that feature.
	
*   **Do you have to worry about CORS?** Yes you do.
    Microsoft has changed the way CORS rules work in the platform settings in Azure Functions. Make sure the rules set work as you intended. I can't stress this enough. Even if this is the case you will have to do some magic (implement your own CORS logic) in the functions app to handle situations where you are running it locally against the mobile/web app.
	
*   **Do your APIs need to scale?** Do you want to worry about load balancing and availability?
    You can't beat the scalability aspects of serverless apps. You do sacrifice certain things for that luxury though. (ie Cold starts)
	
*   **Do you need to have other developers use your API? Need rate control?**
	If you do then API Management is a must. API Management also allows you to authenticate users using Azure AD too.
	
*   **Microservices you say.**
    Yes this is where the serverless paradigm shines through. Be careful though. Azure functions work great with its <a href="https://docs.microsoft.com/en-us/azure/azure-functions/functions-triggers-bindings" target="_blank" rel="noopener">bindings/triggers</a> but they are geared towards cloud platforms. If you need to write to a SQL database, or worse call a SOAP endpoint you will have to do it the old fashioned way without integration support in the form of bindings/triggers from the framework. We ended up using TableStorage, Storage Queues and Blobs. Any additional integration points were implemented using Logic Apps. This is a great combination you can use.


### Final Words


For most of us this was the first time we built a mobile app paired with a serverless web api. I learned a lot about the capabilities of Azure Functions and areas where ASP.NET WebApi outshines it. Your mileage may vary but keep these considerations and experiences in your mind then next time you are presented with the opportunity to implement a web api using Azure Functions or AWS Lambda.

Thoughts? Comments? Please let me know below.
