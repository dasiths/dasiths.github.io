---
title: "Upcoming talk @ API Days, Melbourne 2019"
date: 2019-09-07 22:06
comments: true
header:
  teaser: /assets/images/apidays/logo.jpg
categories: [Conference, Microservices]
tags: [apidays, microservices, public speaking]
---
I'll be speaking about some of my Microservices scars at the upcoming [API Days](https://www.apidays.co/melbourne) conference to be held at Melbourne convention & exhibition centre. My talk is titled `A Game of Snake And Ladders Called Microservices`. It's a reference to the popular board game and hopeful to carry the theme throughout my talk.

# The API Days Conference

![Logo](/assets/images/apidays/logo.jpg)

On the website it says
> APIdays is the leading industry tech and business series of conferences in APIs and the programmable economy. As APIs become mainstream, our world becomes more connected, more automated and more intelligent. APIs are the gateway to data, services, devices and emerging technologies. APIs put power into the hands of developers, citizens and consumers. 

Conference runs on 11+ countries and it's my first time speaking at the event. I'm really stoked a join a line up that consist of speakers from companies like Google, Amazon, Netflix, Airbnb and Okta.

![Speaker List](/assets/images/apidays/speaker-list.png)

[Full speaker list](https://www.apidays.co/melbourne)

# My Talk: A Game of Snakes & Ladders Called Microservices

The abstract is as follows.

> Microservices aren’t new but the last few years have certainly seen a lot of successful implementations of the pattern. The promise of high scalability has attracted engineering teams to it like moths to a flame. There are plethora of benefits but they are accompanied by an ever growing set of technical and nontechnical pitfalls. As the shininess of microservices gradually decline, there are important lessons to learn from our scars. We will look at why microservices implementation fail, How to avoid the pitfalls and most importantly whether you need to ditch your trusty monolith after all.

I've worked in the industry to close to 20 years now and I've seen [SOA](https://en.wikipedia.org/wiki/Service-oriented_architecture) come and transition into Microservices. There is a wealth of knowledge our industry has acquired and most lessons we learnt from SOA can directly be applied. **This talk is targeted at development teams going through a microservices transition or plan to do so.** 

> While most of the content is at an intermediate level, we cover some advanced concepts around distributed system architecture at certain points. It is assumed these concepts are well known by the audience.

Over the last few years I've also got some good results using [DDD](https://en.wikipedia.org/wiki/Domain-driven_design) to define microservice boundaries and data ownership. In my opinion, the two biggest technical problems arrive in the form of data ownership and inter-microservice communication. Most development teams pay little to no attention to these aspects and focus on wrong things like tooling and frameworks. The better implementations of microservices don't try to fight the distributed nature of them and accept the realities of distributed systems. I've also seen the best technical implementations fail because the development teams fail to understand the domain or business requirements properly. 

Conversely, the business's who truly desire the agility advantages of microservices can't expect a purely technical solution. There are so many organisational issues that prevent a business from being agile. Microservices are the least of those.

I've broken my talk down to six sub topics and give a **helicopter view of some of the issues** I've come up against. Since this is a 30 minute time slot the plan isn't to go down to too much detail. My aim is to provide some context and highlight the issues. I might decide to do detailed write up of each aspect later in the year. There are plenty of resource on the internet if your Googlefu is decent :)

## Slide deck

<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.1972%;"><iframe src="//speakerdeck.com/player/539d4f6dd03f4c70915f69a3d521acae" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen scrolling="no" allow="encrypted-media"></iframe></div>

## **Part 1:** History of microservices and looking beyond the marketing pitch

The benefits of microservices are legion but the most focus has been on scalability, team autonomy and agility. While these are all great benefits, often too little focus is given on solving the actual business problems effectively. To make matters worse, organisations and development teams assume these benefits come for free. In my opinion, it is important to look at these business problems through a DDD perspective and come up with a sound solution without thinking about microservices at first. The complexity of a distributed system should be tackled as a part of evolving your system once the domain is fully understood.

The concept of microservices from an abstract point of view isn't something new. When [Alan Kay originally introduced the concepts of object oriented programming](https://softwareengineering.stackexchange.com/questions/46592/so-what-did-alan-kay-really-mean-by-the-term-object-oriented), the responsibility of an object was very similar to what we think of as a microservice today. Not so long ago [CORBA](https://en.wikipedia.org/wiki/Common_Object_Request_Broker_Architecture) solved similar problems and would be touted as a microservice framework if introduced today. There are important lessons for us to learn from these past experiences. I've come up with an abstract definition for this distributed object pattern, that will help us focus on specific aspects of the architecture as we dive deeper later. 

> OBJECTS with well defined responsibilities, Communicating over a MEDIUM, to complete a task

I also examine the following questions and discuss some ways to organize your reasonings when presented with the choice of implementing the microservices architecture.

- Do you have a modular monolith?
- Is the domain well understood?
- Are you doing it for scalability advantages?

## **Part 2:** Organisational challenges

We hear about the success stories of organisations that implement microservices and the agility that has given the business. But I see this as a chicken or egg scenario. It is well known that information systems mimic the existing communication structures within a business. No technology can magically make your business agile. If the business honestly wants to be agile they need to re-examine their communication structures and be prepared to do a top down restructure if necessary. It is clear companies like Netflix went though this transformation prior to them reaping the rewards of their microservices architecture. They go hand in hand.

This ties in to how your teams are structured as well. Rather than having dedicated teams for `DevOps` and `Integration`, an organisation should strive to have cross functional teams that can take responsibility of solution end to end. All of the successful implementations of microservices I have witnessed are accompanied by direct communication channels between stakeholders and development teams that can deliver a product increment without relying on someone else. It's this structure that gives a business agility.

One thing I love about microservices is the choice it gives to the developers. But this comes at a cost too. If you have **too many** technologies to maintain, you never get the chance to master them. Without mastering them it is really hard to be productive as well. This can result in a loss of agility.

Then there are an ever growing set of microservices frameworks that aim to solve all the problems under the sun without having any context of a business requirement. It does not surprise me at all that most of these implementation fail. No one has a crystal ball to look into and decide what problems you might have to solve in the future. So it makes sense no to tie yourself in to a framework. 

If not using a framework, how much core logic should you share? The answer to this depends heavily on your context. Some teams prefer not to share anything. While I do not agree with this as a hard and fast rule I see some merit in it. The argument is that too much sharing of core logic makes your lightweight microservice rely on an ever growing set of core logic. This can reintroduce monolithic type constraints like longer build times and release dependencies. Choose wisely here. I am of the opinion that sharing things like data contracts for API's are fine as they do not carry any heavy logic.

## **Part 3 :** Ownership of data and transactional boundaries

Data and ownership is perhaps the hardest problem to solve when doing a microservice implementation. In a monolithic application design, the reasoning about who owns which data is not as critical. You could always do something like a cross join to another table to get the data you wanted. This gave the developers less reasons to care about data ownership because it was easier to correct course later on. 

With microservices though, sharing persistent data with other microservices has always universally being frowned upon for a variety of reasons. One good reason to not do it due to the fact that it couples the data schemas with each microservice and no single team can do a change without the fear of it affecting an other team. Another reason is that each microservice is best placed to determine its own persistence mechanism. Having one relational database might not scale well for all the scenarios.

A good way to evolve an existing monolithic application is by assigning table level ownership to microservices. Then any dependent microservices can be refactored into using an interface on the owning microservice to access the data. Gradually you can move away the tables in to their own databases and even change the persistence mechanism. I'll investigate this journey with an example during my talk.

Once you start going though this journey, you will find that calling another microservice for data you require isn't the most performant way to do something. It adds the complexity of an external dependency to your logic as well. A better way to solve this problem might be to have a copy of the data you require stored alongside each microservice requiring the said data. This allows the microservices to evolve independently and to evolve their data world view with them. This also reduces sequential dependencies and complexity. For example an product ordering microservice might have the minimum set of customer information saved within its own data store. This can be updated through an event driven mechanism when the customer microservice add/updates a customer.

If you have done a good job identifying your bounded contexts, your transaction boundaries should be within them. This means that intra microservice transactions / distributed transactions aren't required. Conversely if you find that distributed transactions are required, it's a sign that your bounded contexts are wrong. It's very expensive to correct to realign an incorrect bounded context but that is reality of doing microservices. Without understanding the domain properly, you are doomed to fail. That is why never recommend microservices for a greenfield project.

In a distributed system it is reasonable to sacrifice consistency in favour of partition tolerance and availability. In fact the real choice you have here is between availability and consistency as your microservices are partitions of a larger system anyway. I'll dive in to this aspect [CAP theorem](https://en.wikipedia.org/wiki/CAP_theorem) later on when we discuss eventual consistency.

## **Part 4 :** Communicating over the network and choosing between sequential or event driven styles

The major pain point for any distributed architecture is the communication medium between the distributed components. Microservices are no exception. In an monolithic application running in a single process we don't have to deal with the possibility of the communication medium having high latency or low bandwidth for example. But these concerns are real when we introduce a network in between two microservices.

These are some of the assumptions you can not make when one microservice is making a call to another microservice.

- Network is reliable
- Latency is zero
- Infinite bandwidth
- No overheads
- Is secure

It's easy (I've done it) to build something based on these false assumptions when everything is mocked or running in `localhost`. But sooner or later these things come back to bite you. The way to deal with network being unreliable might depend on the individual microservice. (i.e Circuit breaker, timeout, alerts)  The other way to look at it is as being common for everything reliant on the network. So you could have a generic infrastructure level solution for this as well. (i.e. Service Mesh/Side Car). The point though is that you have to solve it. There is no magic silver bullet.

Once you have a sound plan on how you deal with the network failures, you have to decide how you design your API. In modern times you have a choice between REST, GraphQL or gRPC.

- `REST` is great for `CRUD` operations and when you have your domain well defined. The OpenAPI spec helps if you have a lot of public clients consuming your API as well.
- `GraphQL` is the best solution if you have a lot of aggregations and heterogenous data requirements. This decouples your API from the domain models as a result. Due to this, I've found GraphQL API's far easy to gracefully evolve.
- `gPRC` is a new RPC protocol that is language agnostic and use `Protobuf` underneath. It's awesome for action heavy services and works best for inter-microservice communication due to performance reasons.

One of my colleagues recently did an excellent presentation comparing these. [Slide deck is here](https://speakerdeck.com/robcrowley/graphql-grpc-or-rest-resolving-the-api-developers-dilemma). The video isn't out yet but I will update this once I have it.

I would classify all of these under sequential communication pattern though. They are built good for request-response model and fit nicely within a simple workflow. But they are susceptible to network conditions and introduce coupling to your workflow.

On the other hand you have the choice go go with an event driven approach. This fits better with a publish-subscribe model and is far more resilient to network conditions because of the message bus abstraction in between. It also makes microservices less coupled as a consumers don't directly connect to the producer. This makes service discovery a non concern. Because of the message fanning out model for subscribers, it can greatly increase the throughput for certain operations.

Event driven approach comes with its own concerns though. 

The distributed nature of publisher and subscriber mean that there is [no `eaxctly-once` delivery guarantee](https://bravenewgeek.com/you-cannot-have-exactly-once-delivery/). The short reason is that we choose availability and partition tolerance. As a result you end up with `atleast-once` or `atmost-once` guarantee. In most situations we go with the `atleast-once` choice. This means your message handlers need to be idempotent. It's an easy one to miss when you're developing and very hard to diagnose when it happens in a production systems.

Because of the fan out nature of subscribers/messages it is beneficial to keep the payload size low. For example, your message bus might create a queue per subscriber and fan out your 10MB message to 100 subscribing microservices. Now the message bus need to store 1GB of data per message going through the topic. This will not scale very well. In this example it would have been better to store the large payload somewhere are pass a reference to that in the message instead.

The biggest concern in an event driven system though is eventual consistency. It requires a big change in thinking among developers.

## **Part 5 :** Dealing with race conditions and eventual consistency

We briefly touched on the CAP theorem and why we have to choose the availability and partition tolerance options. This means we miss out on strong consistency. This means we have to be content with lesser forms of consistency. In most distributed systems you will deal with sequential or eventual consistency.

This manifests as race conditions in a microservice architecture. i.e. Imagine 2 microservices called `product` and `ordering`. The product microservice stores the `qty-available` against each product. The order microservice allows people to order those items as long as their `order-qty` is not higher than the `qty-available`. Once ordered the order service dispatches a message with the ordered qty. The product service listens to this message and reduces the qty-available appropriately. The message publishing and subscriber processing it happen at two microservices, outside of a transaction. Now consider the scenario where 10 concurrent orders are processed by the ordering microservice. They all see the same `qty-available` figure on the product service upon processing the order. So a few of those orders might not be possible to physically process once the order pick list reaches the warehouse as there is not enough qty available.

Is this a bad thing? Not according to [Gregor Hoppe](https://www.enterpriseintegrationpatterns.com/ramblings/18_starbucks.html) and [Udi Dahan](http://udidahan.com/2010/08/31/race-conditions-dont-exist/). They make very good arguments as to why you should embrace this reality and work on compensating actions rather than artificial ways to prevent this scenario.

My argument is to think about the scalability benefit this approach brings you. You can have the order microservice scaled million times more than the product microservice to cater for your customers. You can still deal with the exceptional situations via compensating actions. You end up making the experience of a majority of people better at the risk of making the experience of a few worse. If it makes you feel any better, this is how Amazon and EBay already work.

The [emergence of NewSQL databases](https://cloud.google.com/blog/products/gcp/inside-cloud-spanner-and-the-cap-theorem) promise higher availability along with strict consistency and partition tolerance. So in the near future you might still be able to work inside the safety net of a transaction but it will never have the performance benefit of a system that doesn't rely on one.

## **Part 6 :** Hidden complexity

There have been a few anti patterns I've seen in the wild. Some of these I've done myself and have scars to prove.

- Event sourcing as a top level pattern

  Event Sourcing works well for transactional systems when applied within a bounded context. As soon as you do it as a top level pattern for all your microservices, you end up having to define your event schema as a public API contract. This makes change harder and have the same effect as microservices sharing a table in a database.

- UI Monolith

  Often the the monolith evolution ends with the backend being segmented in to microservices. But there is one UI service which uses all these to interact with the user. This becomes a bottleneck to development teams and impedes with team autonomy and agility.

  The best answer to this comes in the way to micro front ends. You have the option of server side vs client side rending here but I've only had experience with client side rendering of micro front ends.

  You have to be careful with the composition though. If you have too many micro front ends, it can affect page load severely as each micro front end carries its own bundle with whatever framework was used to develop it. This also means that the UI APP shell is also susceptible to framework incompatibilities caused by micro front ends it hosts.

- Distributed monolith

  The first few evolutions of your monolith usually ends up being one of these. You have microservices that can't function without another. These dependencies make for many points of total failure. Also the distributed nature of the services bring along all the complexity with it. What you now have is a system that is distributed but functions as a monolith.

  There is no clear answer to this. Each microservice might have to deal with dependencies not being available in their own way. I once developed a online quoting system that relied on the pricing service for latest prices. In case of the pricing service being unavailable, it would save the requested quote information and and let the user know that the quote would be emailed. Once the pricing service was back up it would process the saved quote information and email the latest prices. You have to come up with creative solutions to solve your problems. 

### Service Meshes
As your microservice count grow you will find that the following cross cutting concerns need common solutions.

- Service Discovery
- Load Balancing
- Inter microservice calls: Circuit Breaker, Retry etc
- Dynamic Routing
- Security & Access Control
- Monitoring & Tracing

Rather than trying to solve these in each microservice implementation, you could leverage the [side car pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/sidecar) for this. The side car can proxy all your network calls and abstract away the infrastructure concerns. This helps your microservice focus on the business logic. You might be able to take this further using a [service mesh architecture](https://www.nginx.com/blog/what-is-a-service-mesh). It gives you the ability to monitor the traffic the react to exceptional conditions faster.

## Conclusion

Let's revisit our guiding questions. 

- Do you have a modular monolith?

  If the answer is no then you are not ready to do microservices. The first evolution of a monolith should be to decompose it to a component based modular monolith. This process will highlight your bounded contexts and dependencies better.

- Is the domain well understood?

  If not you will struggle to define bounded contexts and microservice boundaries. At this point a monolith might be a better fit.

- Are you doing it for scalability advantages?

  While microservices provide great scalability advantages, it's not the best selling point of them IMO. If scalability and performance are your major concerns, then the chances are there are easier ways to achieve it without going down the path of microservices. Even if you do decide to go with a microservice architecture, the first few evolutions are likely to be less performant than your current monolith.

### Parting thoughts
If anything the point this presentation aims drive home is that monoliths have their place. The journey to microservices should be thought of as evolution of many steps. Amazon, Netflix and EBay all started as monolithic applications that solved the business problems well. They had to implement a microservice architecture to serve the millions of customers they do today but that came later in the evolution.

My advise for a start-up or a business that wants to make a disruption is to start with a monolith and solve key business problems well. Time to market is most definitely not an advantage of microservices. Your super technically excellent architecture might be useless if it gets to the market too late.

I am going through a journey of learning microservices architectures myself. Please share your experiences and blog about them. The industry needs to share their war stories more. There is no shame in failing while learning.

If you have any thoughts or comments please leave them here. I hope you come down to my talk and stick around to say hello.

See you there.