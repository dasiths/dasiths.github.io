---
title: "Setting Up AzureAD Multi-tenant Authentication With ASP NET Core And Angular"
date: 2019-04-27 12:00
header:
  teaser: /assets/images/key-74534_960_720.jpg
comments: true
categories: [.net, azure ad, multi-tenant]
tags: [.net, azure ad, multi-tenant, aspnet core, angular]
toc: true
toc_label: "Content"
toc_sticky: false
---

Using Azure AD to implement a multi-tenant application is fairly straight forward. It requires turning on a few knobs and switches from the portal and you're most of the way there. In this post we will look at how to setup an multi-tenant app registration and implement the logic in the front end to direct the user to a `common` sign-in endpoint. We will also look at how to control access to a pre determined set of tenants.

## App Registration

This is the easy part. Create an app registration from the Azure portal and turn on the multi-tenant switch. You can find it under `Properties`. If you haven't already, provide a unique `App ID URI` for the app. This has to be unique across every tenant.

![multi-tenant app registration](/assets/images/azure-ad-appregistration-multitenant-switch.png)

The Microsoft [docs](https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-convert-app-to-be-multi-tenant) say this.
> By default, apps created via the Azure portal have a globally unique App ID URI set on app creation, but you can change this value. For example, if the name of your tenant was contoso.onmicrosoft.com then a valid App ID URI would be https://contoso.onmicrosoft.com/myapp. If your tenant had a verified domain of contoso.com, then a valid App ID URI would also be https://contoso.com/myapp. If the App ID URI doesn’t follow this pattern, setting an application as multi-tenant fails.

Now in your `Reply URLs` section, add an entry for the `callback url` that Azure AD will redirect the user to, after a successful sign-on. I usually put something like `http://localhost:4200/callback` but the host address will depend on where you host your app. For demo purposes let's assume my app is running on `localhost:4200`.

## Azure AD sign-in process

In a single tenant application, the user is directed to an url like `https://login.microsoftonline.com/contoso.onmicrosoft.com` where `contoso.onmicrosoft.com` is the tenant the user is expected to sign into.

With a multi-tenant application, we don't know the the tenant of the user until they log-in. So we need to direct them to a `common` endpoint. Hence the sign in url becomes `https://login.microsoftonline.com/common`

It's important to remember that `common` is not a tenant. It's just a multiplexer that lets the user log-in to a specific tenant. When Azure AD issues an `id token` for the logged in user, it has a claim called `iss` ([Issuer](https://openid.net/specs/openid-connect-core-1_0.html#IDToken)). This claim will match the tenant the user belongs to. For example, if my `tenant id` is `31537af4-6d77-4bb9-a681-d2394888ea26` then the `iss` claim would be `https://sts.windows.net/31537af4-6d77-4bb9-a681-d2394888ea26/`

The docs also say this
> The /common endpoint is not a tenant and is not an issuer, it’s just a multiplexer. When using /common, the logic in your application to validate tokens needs to be updated to take this into account.

## Validating the issuer

> Note: **I'm using Azure AD V1.0 endpoint for demonstration purposes**.

I'm using ASP NET Core web Api project as the backend for my application. Let's go ahead and implement the whitelisting logic there.

- Define a class to hold the settings.
    ```csharp
    public class TokenValidationSettings
    {
        public string ClientId { get; set; }
        public string[] AllowedIssuers { get; set; }
    }
    ```
    Then update the `appsettings.json` with the values.
    ```json
    {
    "TokenValidationSettings": {
        "ClientId": "your app registration's app id", // The Client ID is used by the application to uniquely identify itself to Azure AD. e.g. 82692da5-a86f-44c9-9d53-2f88d52b478b
        "AllowedIssuers": [
        "https://sts.windows.net/13ae57df-8a51-414a-a59a-328118705efc/", // issuer 1, tenant Id 13ae57df-8a51-414a-a59a-328118705efc
        "https://sts.windows.net/423504eb-8652-47d2-aa72-ddbba4584471/" // issuer 2, tenant id 423504eb-8652-47d2-aa72-ddbba4584471
        ]
        }
    }
    ```
- Now introduce our token white listing logic
    ```csharp
    public interface IIssuerTokenValidator
    {
        string Validate(string issuer);
    }
    ```
    ```csharp
    public class IssuerTokenValidator : IIssuerTokenValidator
    {
        private readonly ILogger<IssuerTokenValidator> _logger;
        private readonly TokenValidationSettings _options;

        public IssuerTokenValidator(ILogger<IssuerTokenValidator> logger, IOptions<TokenValidationSettings> options)
        {
            _logger = logger;
            _options = options.Value;
        }

        public string Validate(string issuer)
        {
            if (_options.AllowedIssuers == null || _options.AllowedIssuers.Length == 0)
            {
                _logger.LogWarning("No allowed issuers configured in {@Options}", _options);
            }

            var allowedIssuers = _options.AllowedIssuers;
            if (allowedIssuers == null || !allowedIssuers.Contains(issuer, StringComparer.Ordinal))
            {
                _logger.LogError("Rejected ID token issuer {Issuer}", issuer);

                throw new SecurityTokenInvalidIssuerException($"Rejected ID token issuer {issuer}")
                {
                    InvalidIssuer = issuer
                };
            }

            _logger.LogDebug("Accepted ID token issuer {Issuer}", issuer);

            return issuer;
        }
    }
    ```

- We have to wire it up in the `Startup.cs`. Use the `ConfigureServices()` method to do it.

    ```csharp
    services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)    
    .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme,
        configureOptions: null);
    // No need to pass options here, we configure it later through ConfigureJwtBearerOptions

    services.AddSingleton<IConfigureOptions<JwtBearerOptions>, ConfigureJwtBearerOptions>();
    services.AddSingleton<IIssuerTokenValidator, IssuerTokenValidator>();
    services.Configure<TokenValidationSettings>(configuration.GetSection(nameof(TokenValidationSettings)));
    ```

    This requires we introduce an implementation for `IConfigureNamedOptions`. We use this class to configure our settings and let the DI container handle the creation process. More information about the pattern can be found [here](https://andrewlock.net/simplifying-dependency-injection-for-iconfigureoptions-with-the-configureoptions-helper/).
    ```csharp
    public class ConfigureJwtBearerOptions : IConfigureNamedOptions<JwtBearerOptions>
    {
        private readonly IIssuerTokenValidator _tokenValidator;
        private readonly TokenValidationSettings _options;

        public ConfigureJwtBearerOptions(IIssuerTokenValidator tokenValidator, IOptions<TokenValidationSettings> options)
        {
            _tokenValidator = tokenValidator;
            _options = options.Value;
        }

        public void Configure(string name, JwtBearerOptions options)
        {
            if (name.Equals(JwtBearerDefaults.AuthenticationScheme))
            {
                options.Authority = "https://login.microsoftonline.com/common";
                options.Audience = _options.ClientId;
                options.RequireHttpsMetadata = true;
                options.TokenValidationParameters = new TokenValidationParameters()
                {
                    ValidAudience = options.Audience,
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerValidator = (issuer, token, parameters) => _tokenValidator.Validate(issuer)
                };
            }
        }

        public void Configure(JwtBearerOptions options)
        {
            // default case: no scheme name was specified
            Configure(string.Empty, options);
        }
    }
    ```
That's it for the back end. We can use an `Exception Filter` to catch `SecurityTokenInvalidIssuerException` and map it to a `401` response. It really depends on how you want to handle non white listed tenant user logging in. You can catch this exception from the front end and redirect the user to a specific place. There are many examples on the internet on how to do this if you're interested.

## The single page application (Anglar app)

I won't cover how to setup `ADAL JS` (Active Directory Authentication Library for JavaScript) here. It's out of scope for this post. If you haven't done it before, [this is a good place to start](https://devblogs.microsoft.com/premier-developer/angular-how-to-microsoft-adal-for-angular-6-with-configurable-settings/).

The part I want to focus on is this.
```json
  "azureConfig": {
    "tenant": "common",
    "clientId": "your app registration's app id",
    "redirectUri": "http://localhost:4200/callback"
  }
```
The `tenant` must be set to `common` and the `redirectUri` must be one of the url's we specified earlier when we setup the app registration.

### Overview of the Angular setup
As an example I have my `Login` and `Callback` component routes unguarded. The `AuthGuard` checks to see if the user is authenticated and redirects them to the Login route if they aren't. The Login component then calls the `Login()` method on the ADAL service.
```typescript
const routes: Routes = [
  { path: 'callback', component: CallbackComponent },
  { path: 'login', component: LoginComponent },
  { path: 'my-stories', component: HomeComponent, canActivate: [AuthGuard] }
  // other routes here
]
```

Include the call-back component to handle the redirect from Azure AD when the user successfully logs in. The route to this component should be the same as the one in `redirectUri`.

There are many wrappers for ADAL JS that can be used with Angular. Pick one that you like. I didn't include code samples for that reason. You should be alright as long as you stick to the overview.

## Conclusion

As you would have noticed the scenario we tried to cover isn't very hard to implement and Azure AD has full support for it. Things get a bit more interesting when you have to support **many** authentication schemes in a multi-tenant app (specially if the authentication schemes are based on the tenant) but that's a story for another time. Hopefully this has given you an understanding of how multi-tenancy works in Azure AD.

If you have thoughts or comments please feel free to share them in the comments section. Thank you.