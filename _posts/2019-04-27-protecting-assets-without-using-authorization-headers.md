---
title: "Protecting Assets Without Using Authorization Headers (i.e. Bearer Tokens)"
date: 2019-04-29 12:00
header:
  teaser: /assets/images/photo-1518206075495-4e901709d372.jpg
comments: true
categories: [.net, aspnet core, security]
tags: [.net, aspnet core, security, tokens]
---
Consider this scenario. 

You have developed a SPA (Single Page Application) that uses some form of OAuth to retrieve an access/bearer token. You now append that to your http request header when you call your backend REST API. The backend inspects the token and processes the request. All is well. 


## The Problem
Let's assume you have a requirement to give the user access to a resource that's protected by the API but you have no ability to append the access token to the request's authorization header. *Bugger*.

## Context 
This was the case on a recent project I worked on. The tech stack was `ASP NET Core` and `Angular`. We had some files stored in `Azure Blob Storage` but we didn't want the user to have direct access to them. We had an API endpoint that was protected and the auth was done via bearer tokens. Nothing spcial. The experience we desired was for the user to click a link to download attachment and then the browser's save file dialog to appear.

## Solution

Assuming the link is `<a href="api/attachment/filename.zip">Click here</>`, we have a catch 22 here. 

If we have a simple link, it means we can't intercept the http request to add the bearer token. If we dynamically download the file using an `AJAX` request, then we would have trouble triggering the `Save File` dialog of the browser. Luckily there are ways to get around this problem.

We came up with two solutions.

## **Solution Approach 1**: Creating a data url

Download the file using an `AJAX` request and use some trickery to open an object (Base64 encoded) url. This [method is described here](https://www.illucit.com/en/angular/angular-5-httpclient-file-download-with-authentication/). The advantage of this approach is that you don't need to do any changes in the backend. You can simply add the `[Authorize]` attribute to the api endpoint because the `AJAX` request allows us to add the bearer token.

It's simple as doing the following.

```typescript
    // OnClick of the url
    public urlClicked(id: string): void {
        this.downloadFile(id).subscribe(data => this.downloadBlobData(data));
    }

    // http is angular http client
    private downloadFile(id: string): Observable<Blob> {
        let headers = new Headers();
        headers.append('Authorization', auth_token); // or let your interceptor add it
        let options = new RequestOptions({
                responseType: ResponseContentType.Blob,
                headers: headers 
            });
        return this.http.get('api/attachments/' + id, options)
            .map(res => res.blob());
    }

    private downloadBlobData(data: Response): void {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        window.open(url); // caution: popup blockers might prevent this
    }
```

> See this [Stackoverflow question](https://stackoverflow.com/questions/35138424/how-do-i-download-a-file-with-angular2) for **more code samples** and a few NPM packages that automatically handle this for you.

## **Solution Approach 2**: Using short lived magic urls/tokens

When the user click on the link, make an `AJAX` request with the bearer token to a special api endpoint which is protected with the `[Authorize]` attribute. This endpoint looks at your credentials and checks if you have access to the file you requested. Then generates a `magic-url` that is valid for short period of time. This `magic-url` can be used to download the file from unprotected api endpoint. We can even invalidate that `magic-url` once it has been used.

This makes things a bit more complicated in the backend. Lets see how we can implement this.

We need to store the magic link information in the app. Define a class for that.

```csharp
    public class ResourceAccessPass
    {
        public string ResourceId { get; }
        public Guid Token { get; }
        public DateTimeOffset Expiry { get; }
        public Guid IssuedUserId { get; }

        public ResourceAccessPass(Guid issuedUserId, string resourceId, DateTimeOffset expiry, Guid token)
        {
            IssuedUserId = issuedUserId;
            ResourceId = resourceId;
            Expiry = expiry;
            Token = token;
        }
    }
```

Define an interface for the resource access manager. This will hold the responsibility to creating the magic url and then exchanging it for a resource. In this example, I'm persisting everything in memory and not using a disk or database.

```csharp
    public interface IResourceAccessManager
    {
        ResourceAccessPass GenerateResourceAccessPass(Guid userId, string resourceId);
        ResourceAccessPass RetrievePass(Guid token);
    }
```
The implementation is as follows.
```csharp
public class ResourceAccessManager : IResourceAccessManager
    {
        private readonly ILogger<ResourceAccessManager> _logger;
        private readonly IList<ResourceAccessPass> _passes = new List<ResourceAccessPass>();
        private readonly object _lockObject = new object();

        public ResourceAccessManager(ILogger<ResourceAccessManager> logger)
        {
            _logger = logger;
            _resourceAccessManagerOptions = resourceManagerOptions.Value;
        }

        public ResourceAccessPass GenerateResourceAccessPass(Guid userId, string resourceId)
        {
            lock (_lockObject)
            {
                ClearExpired();
                var pass = _passes.FirstOrDefault(a =>
                    a.IssuedUserId == userId && a.ResourceId == resourceId);
                if (pass != null)
                {
                    _passes.Remove(pass);
                    _logger.LogDebug($"New token requested and existing {nameof(ResourceAccessPass)} for UserId={pass.IssuedUserId}, ResourceId=${pass.ResourceId} removed from memory.");
                }
                pass = new ResourceAccessPass(userId, resourceId,
                    DateTimeOffset.Now.AddSeconds(60), // 60 seconds expiry
                    CreateCryptographicallySafeGuid());
                _passes.Add(pass);
                return pass;
            }
        }

        public ResourceAccessPass RetrievePass(Guid token)
        {
            lock (_lockObject)
            {
                ClearExpired();
                var pass = _passes.FirstOrDefault(a => a.Token == token);
                if (pass == null)
                {
                    throw new InvalidOrExpiredResourceAccessTokenException(token.ToString());
                }
                _passes.Remove(pass);
                return pass;
            }
        }

        private void ClearExpired()
        {
            var expired = _passes.Where(a => a.Expiry <= DateTimeOffset.Now).ToList();
            foreach (var pass in expired)
            {
                _passes.Remove(pass);
                _logger.LogInformation($"Expired {nameof(ResourceAccessPass)} for UserId={pass.IssuedUserId}, ResourceId=${pass.ResourceId} removed from memory.");
            }
        }

        private static Guid CreateCryptographicallySafeGuid()
        {
            // Why we don't use Guid.NewGuid() 
            // https://stackoverflow.com/questions/467271/how-random-is-system-guid-newguid

            using (var provider = new RNGCryptoServiceProvider())
            {
                var bytes = new byte[16];
                provider.GetBytes(bytes);
                return new Guid(bytes);
            }
        }
    }
```
The Exception Type to throw when something goes wrong. You can map this to a 401 in your `ExceptionFilter` if you wish to do so.
```csharp    
    public class InvalidOrExpiredResourceAccessTokenException : Exception
    {
        public InvalidOrExpiredResourceAccessTokenException(string message): base(message)
        {
        }
    }
```

That's the hard part done but we need two endpoints. One to create the magic url (token), another to exchange the token for a the actual file.

```csharp
public AttachmentController {
    private readonly ResourceAccessManager _resourceAccessManager;

    public AttachmentController(ResourceAccessManager resourceAccessManager){
        _resourceAccessManager = resourceAccessManager;
    }

    // end point to generate the token
    [Authorize]
    [Get("token/{resourceId}")]
    public ActionResult<Guid> GetResourceAccessPass([FromRoute]string resourceId) {
        var userId = HttpContext.User.Id; // or your mechanism to retrieve current user

        // You can check to see if the user has access to the resource using your own logic here

        var pass = _resourceAccessManager.GenerateResourceAccessPass(userId, resourceId);
        return pass.Token;
    }

    // endpoint to download the file
    [AllowAnonymous]
    [Get("download/{token}")]
    public IActionResult DownloadFile([FromRoute]Guid token) {
        var userId = HttpContext.User.Id; // or your mechanism to retrieve current user
        var pass = _resourceAccessManager.RetrievePass(token);
        return _myFileAccessService.GetFile(pass.ResourceId);
    }
}
```
> Note: I've simplified the logic and put this inside the controller. `_myFileAccessService` is some sort of service that reads your files from Blob Storage or disk. I won't include the code for that as it's outside the scope.

Finally do this in the `ConfigureServices()` method of your `Startup.cs` file. We use a singleton to persist our `ResourceAccessManager`'s passes across requests. Because the tokens are so short lived, there is no need to persist it to disk.

```csharp
services.AddSingleton<IResourceAccessManager, ResourceAccessManager>();
```

That's it for the backend.

There is still a couple of things we need to do in order to wire things up on the frontend.

```typescript
private urlClicked(string attachmentId): void {
    this.getAttachmentUrl(this.attachment.id)
    .subscribe(url => {
        window.open(url); // caution: popup blockers might prevent this
    });
}

private getAttachmentUrl(attachmentId: string): Observable<string> {      
    const tokenUri = `api/attachment/token/${attachmentId}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    headers.append('Authorization', auth_token); // or let your interceptor add it

    return this.http.get<string>(tokenUri, { headers: this.headers }).pipe(map(
      token => `api/attachment/download/${token}`));
}
```

In your view you can simply do something like
```html
<a (click)="urlClicked('my-important-file.pdf')">Download</a>
```

That should allow you to download the file using the new token.

## Conclusion

We looked at two approaches to download a file. The second method is a bit for extensible and you can use it to solve some other requirements as well. One limitation of our magic url/token solution is that we store them in memory. So an app restart will lose them. This isn't a big deal as the tokens are short lived. I recommend using Microsoft's [Data Protection API's](https://docs.microsoft.com/en-us/aspnet/core/security/data-protection/using-data-protection?view=aspnetcore-2.2) if you need to persist them on disk.

Thank you for reading and please let me know your thoughts and comments.




