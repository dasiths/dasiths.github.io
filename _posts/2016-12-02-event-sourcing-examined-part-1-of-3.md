---
title: "Event Sourcing Examined Part 1 of 3"
date: 2016-12-02 15:23
comments: true
categories: [Event Sourcing]
tags: [.net, aggregates, bounded context, cqrs, Domain Driven Design, greg young, neventlite]
header:
  teaser: /assets/images/event-sourcing.jpg
---
In this 3 part series we will look at what event sourcing is and why enterprise software for many established industries use this pattern.


### Index


1. Part One (This one)
	*   Introduction to Event Sourcing
	*   Why Use Event Sourcing?
	*   Some Common Pitfalls
	
2. [Part Two](http://dasith.me/2016/12/31/event-sourcing-examined-part-2-of-3/)
	*   Getting Familiar With Aggregates
	*   Event Sourcing Workflow
	*   Commands
	*   Domain Event
	*   Internal Event Handler
	*   Repository
	*   Storage & Snapshots
	*   Event Publisher
	
3. [Part Three](http://dasith.me/2017/08/02/event-sourcing-examined-part-3-of-3)
	*   CQRS
	*   Read Side of CQRS
	*   Using NEventLite

<hr />

### Introduction


A name that's almost synonymous with Event Sourcing is Greg Young. I suggest spending some time watching his many youtube videos to get a grasp of what event sourcing is. He is the main developer of <a href="http://geteventstore.com" target="_blank" rel="noopener">EventStore</a>, an event storage engine that has fast become my first choice for event sourcing.

Watch this YouTube video if you can spare a moment 
[![Greg Young - Code On Beach](https://img.youtube.com/vi/JHGkaShoyNs/0.jpg)](https://www.youtube.com/watch?v=JHGkaShoyNs)


### What is Event Sourcing?


I'm going to give you a generic definition first.


> ***Event Sourcing** Pattern. Use an append-only store to record the full series of **events** that describe actions taken on data in a domain, rather than storing just the current state.*


### But Why?

Good question. Consider this scenario. You look at your bank balance and don't agree with what's shown. You ring them up and complain the balance isn't correct. If banks didn't use event sourcing all they would have is the current state (balance) of your account. So it would be your word against theirs.


> **In its most simple form event sourcing is nothing but storing all the domain events so your state changes are represented as a series of actions. We treat state changes as a first class concept.**


The reasons for using the event sourcing pattern are legion. Some of them are...


*   **Ability to track all changes done to the domain**
This is perhaps the core foundation on which an event sourcing system is built. Since we will store all domain events done to Aggregates (I'll cover Aggregates in part 2) there is an audit trail of how the current state of an Aggregate came to be. This is why your company accountant uses what's called a ledger.


*   **Rebuild your state to a point in time**
With the stored series of events we can quickly replay them to a point in time to construct a "World View" of how the system was at a specific time. Why is this useful?

Ever tried to report on a newly introduced metric but the customer wanted this information for the previous 12 months too? *Ex. What percentage of customers removed an item from the shopping cart before they checked out?* 

If you are using a relational database you will pull your hair out at this point. With event sourcing you would already have this information. You would just have to replay events for the past 12 months and report based on a "shopping cart item removed" domain event. This ability to go back and construct the state gives a huge advantage to the business because they can analyze the past better and you get an audit trail for free.

*   **Less coupling between the representation of current state in the domain and storage** (Ideal for CQRS)
When you store state, the natural inclination is to map your state to columns or fields in storage. This increases the coupling between your representation of state and how you decide to store them.

With event sourcing you are only concerned about storing events. For the read side we often use a thin data layer which is highly optimized for reads. We can even use a <a href="http://blog.jonathanoliver.com/event-sourcing-and-snapshots/" target="_blank" rel="noopener">snapshot strategy</a> to recreate the read model faster but that's outside the context of this post.

This is why Event Sourcing plays so nicely with <a href="http://martinfowler.com/bliki/CQRS.html" target="_blank" rel="noopener">Command Query Responsibility Segregation</a> (CQRS).

*   **Ability to have many world views**
We can have one or many read-models for use case specific interpretation of current state. This is powerful because this gives us the ability to present the same information in multiple ways depending on how the information consumed. Imagine if you have World View ABC and Word View XYZ subscribing to the same events (from the store / publisher) and updating their state/schema accordingly. ABC and XYZ might have different ideas of what each event means to them but the important concept here is that they both consume the SAME event.

*   **Impedance mismatch is reduced between your domain and a relational database**
In Object Oriented development we are faced with a challenge when persisting objects / aggregates to storage. We often go from a "graph" type relationship to a "tabular" form of storage. It's even harder to convert a tabular form of data back to a graph form.

This is what's called <a href="https://en.wikipedia.org/wiki/Object-relational_impedance_mismatch" target="_blank" rel="noopener">Impedance Mismatch</a>. ORMs have been trying to minimize this for decades but ORM's are a leaky abstraction. Don't get me wrong. I love EF and NHibernate but you have to account for impedance mismatch when you choose to use an ORM. An ORM is not a magic bullet.

Event Sourcing reduces this by not storing state. An event is immutable and easily serializable to a tabular form. Since we are only storing events most concerns of Impedance Mismatch go away.

*   **Easier to debug (Some times)**
You can copy the events from the Production environment to a Dev environment and replay them to build the current state. This gives you a chance to add extra logging or allows you to step through certain parts of the code to dig deeper when something isn't working as expected. This is basically like using the remote to pause/play/rewind to look at a sports highlight. You can go one step further by storing commands (when using CQRS) and replaying them.


### So Why Not Use Event Sourcing All The Time?


![Only a sith deals in absolutes](/assets/images/f93c76303736d0ace43ec0892996cb214c5a81ccb436355d27952794eecca144.jpg) 

Short answer. There is a time and place. Implementing Event sourcing is hard and time consuming. I wouldn't recommend it unless the advantages described really add business value.

Be careful when you select the event sourcing pattern. Read up on the pitfalls and anti patterns like "Command Sourcing".

<a href="https://www.infoq.com/news/2016/04/event-sourcing-anti-pattern" target="_blank" rel="noopener">A entire system built just on Event Sourcing is an anti pattern too</a>. Architecturing is hard. There are pros and cons to every choice you make. You make your life easier when you make those decisions based on requirements rather than just "resume driven development".


### Something to keep in mind


>ES + CQRS (Event Sourcing & Command Query Responsibility Segregation) is not a top level architecture pattern. <a href="https://msdn.microsoft.com/en-us/library/jj591572.aspx" target="_blank" rel="noopener">CQRS will complement</a> a top level design pattern like SOA. CQRS will work well for a <a href="http://martinfowler.com/bliki/BoundedContext.html" target="_blank" rel="noopener">bounded context</a> in DDD. Some may even go further to say CQRS fits into a <a href="http://udidahan.com/2012/02/10/udi-greg-reach-cqrs-agreement/" target="_blank" rel="noopener">business component within a bounded context</a>. If you aren't sure whether your bounded context requires ES + CQRS the chances are that it doesn't. CQRS is only needed for very specific use cases (Scalability, Complex Business Logic and Large Teams, etc). So choose wisely as there is a lot of complexity that comes with it. You have been warned.


### Some Common Pitfalls


*   **It's still an unfamiliar concept to many**
Event Sourcing although as a concept has been around for a long time in software development (Since ancient times in many other fields), it's not something that's been used often enough. Therefore you aren't going to find a lot of people in your team familiar with the concept. Even though the pattern isn't hard to understand it forces people to change their way of thinking. Initially you will find it hard to grasp especially when implementing. But once setup it's fairly straightforward to add new functionality because it will be a process of repetition.

*   **External systems or dependencies**
If our system depends on external systems there is a risk that we can't replicate information gathered from an external system at a specific point in time to replay events. There are ways to get around this by storing the information gathered from the external system in the event. Be aware of this if dealing with external systems

*   **Async?**
Just because we are building a CQRS system doesn't mean the commands need to be asynchronous. There are times when this is not required. (Ex. Your source control system uses event sourcing but the COMMIT is not asynchronous). Just keep in mind that while Asynchronous processing will scale better it's not a must to implement event sourcing.

*   **Eventual Consistency (Not really a con)**
Event Sourcing introduces <a href="https://en.wikipedia.org/wiki/Eventual_consistency" target="_blank" rel="noopener">eventual consistency</a> to the system. While this is not a bad thing (Hint: It's how the real world works) this makes things a hell of a lot harder to implement properly. <a href="http://danielwhittaker.me/2014/10/27/4-ways-handle-eventual-consistency-ui/" target="_blank" rel="noopener">Specially the UI</a>.

*   **Event schema changes**
Overtime your event schema will change. Events are immutable so you need to handle versioning of your events. There are <a href="https://abdullin.com/post/event-sourcing-versioning/" target="_blank" rel="noopener">many strategies</a> for this. Pick one that's right for the context.

*   **ID generation**
If your internal event handlers generate ID's then they can't be random. The idea is you can replay your events many times and the resulting state must be the same. If the system generates a random identifier while replaying, a future event yet be replayed might fail because it now can't correlate to the new ID.

### So What's Next?


In the next post I will look at some of the core concepts when trying to implement Event Sourcing. I will be using .NET and C# for code demonstrations and will introduce you to my Event Sourcing framework <a href="https://github.com/dasiths/NEventLite" target="_blank" rel="noopener">NEventLite</a>.

DISCLAIMER: *You generally want to avoid "frameworks" when implementing CQRS or Event Sourcing but NEventLite will help get you on the rails. You can swap out every aspect of it if need be. Think of it as training wheels.*
