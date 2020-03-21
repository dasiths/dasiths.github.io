---
title: "Preventing fat/bloated/god controllers by following a simple endpoint pattern"
date: 2020-03-21 12:00
header:
  teaser: /assets/images/simple-endpoints-teaser.jpg
comments: true
categories: [.net, aspnet core]
tags: [.net, aspnet core, controller, endpoint, pattern]
---
I've been working with ASP.NET/CORE MVC and WebApi for a while now and there is a common problem I often run in to. It's the case of the fat/bloated/god controller. It's a fairly simple problem to diagnose and most developers I speak to understand why these are anti patterns. But why does it keep happening and how do we ensure that it doesn't? What makes god developers fall into this trap?

    The libary referenced in this post is hosted at https://github.com/dasiths/SimpleEndpoints.

## The Why

Typically in a greenfield project you start with clean controller and has a few endpoints. You have some sort of domain layer or a mediator that the request gets dispatched to. So you end up doing some sort of mapping in the controller action method to transform the request parameters to a known type of view model as required. All good so far. The code base is manageable.

But then your project grows and the domain evolves. It's no longer easy to make a judgement call as to what controller your action methods should sit. Do you create a new one or do you reuse an existing one? This becomes doubly hard in the case of `REST` as you really need to understand your domain before you define your resources.

## The Problem

So the developers often take the path of least resistance/effort and use an existing controller when adding new features. This leads to them then introducing further dependencies to the domain layer and mappers. If you're using DI this usually means that the constructor signature keeps growing in size. If you have any controller level unit tests this requires updating those to mock the new dependencies but that's not that hard.

The above takes little to no effort to do but what this does over the long run is that your controller becomes bloated and fat. Your controller now does many things in the domain like some sort god. This is what we were trying to avoid but the controller ended up being a victim of circumstance.

The longer this keeps going on for the harder it becomes to make decisions about the domain. Often new developers will look at the existing controllers, see a related feature and then chuck the new feature in there as well. This snowball effect makes the controller boundaries really hard to reason with in proportion of how long the project has been running. What started out as a simple problem now takes considerable thinking and refactoring to weed out. If the business isn't willing to use resources to improve tech debt then the developers keep quietly accepting the bloated nature of the controllers as inconvenient reality and move on.

The velocity of adding new features and consistency of your API gets affected in the end.

## Solution

There is no magic bullet. In the end this really does come down to how empowered your development team is. Do they have the autonomy to deal with domain changes and refactor the current controller or API surface? Does the business work with the development team prioritize tech debt? **Are they disciplined**?

All of the above need to happen. But what patter can we embrace that directs us towards the pit of success? IMO the point which is most important in the workflow is when we decide where the action method goes. What if we introduce a pattern where each new action method sits in its own class and file? This way the developers always follow the pattern and create "endpoints" as required. Routing becomes a secondary concern.

I've thought about this for a while and I came up with this pattern and implemented it as a library so other people can use it.

The library is called [SimpleEndpoints](https://github.com/dasiths/SimpleEndpoints) and is hosted on GitHub.

<a href="https://github.com/dasiths/SimpleEndpoints"><img src="https://dasith.me//assets/images/simple-endpoints-logo.png" alt="Logo" width="200"/></a>

## Using SimpleEndpoints

SimpleEndpoints has a concept called an Endpoint. Think of an Endpoint as a controller + action method. Your API will consist of many of these endpoints.

Let's start with an example.

1. In the NuGet Package Manager Console, type:

    ```
    Install-Package SimpleEndpoints
    ```

2. Define your request and response models

    ```c#
    public class GreetingRequest
    {
        public string Name { get; set; }
    }

    public class GreetingResponse
    {
        public string Message { get; set; }
    }
    ```

3. Create the endpoint

    ```c#
    [Route("[endpoint]")]
    public class BasicEndpoint: AsyncEndpoint<GreetingRequest, GreetingResponse>
    {
        [HttpGet]
        public override async Task<ActionResult<string>> HandleAsync([FromQuery]GreetingRequest requestModel, CancellationToken cancellationToken = default)
        {
            return new GreetingResponse() {
                Message = $"Hello {requestModel.Name}"
            };

            // or call the domain if you don't want to handle it here
            // e.g. with mediator
            // return await _mediator.Send(greetingRequest, cancellationToken)
        }
    }
    ```

    or even better, use the built in convention based `AsyncGetEndpoint` class which does the same thing as above without the need for the class/method attributes.

    ```c#
    public class BasicEndpoint: AsyncGetEndpoint<GreetingRequest, GreetingResponse>
    {
        public override async Task<ActionResult<string>> HandleAsync(GreetingRequest requestModel, CancellationToken cancellationToken = default)
        {
            return new GreetingResponse() {
                Message = $"Hello {requestModel.Name}"
            };
        }
    }
    ```

    The aim of this pattern is not to blur the line between the controllers and the domain layer. You can choose to dispatch the request to the domain from the endpoint or handle it in the endpoint itself. **Make an infromed choice based to the context**.

That's it.

I've had good success with creating a folder structure like below.

![Folder Structure](/assets/images/simple-ednpoints-folderstructure.png)

You can take this one step further and create a folder per feature group if you want as well.

## Conclusion

We looked how the controller pattern can get abused and turn into something we have a hard time maintaining. The `SimpleEndpoints` pattern makes your endpoints concise, clear and lightweight. This will make it easier understand and reason when your project eventually evolves.

Please leave any comments or feedback. Thank you.
