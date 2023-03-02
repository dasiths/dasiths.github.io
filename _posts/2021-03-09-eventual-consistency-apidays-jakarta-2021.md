---
title: "The Shell Game Called Eventual Consistency - API Days Jakarta 2021"
date: 2021-03-09 22:06
comments: true
header:
  teaser: /assets/images/apidays/api-days-jakarta-talk.jpg
categories: [Conference, Microservices, Distributed Systems]
tags: [apidays, microservices, distributed systems, public speaking]
toc: true
toc_label: "Content"
toc_sticky: true
---
A few weeks ago I spoke at [API Days Jakarta](https://www.apidays.global/jakarta/) about some of experiences building distributed systems.

As more and more companies take their businesses to the web, they are finding that their customers are demanding highly responsive and highly available systems. So developers are expected to build those responsive distributed systems more than anytime in the past. This means that in certain situations you as developers have to let go of strong consistency or distributed transactions. Even in other cases more and more software systems are embracing asynchronous workflows or messaging systems. In all of these scenarios your front end needs to deal with eventual consistent backend nodes/partitions.

The aim of the talk was to give the audience a cooks tour around the concept of eventual consistency and a few creative ways to deal with it.

I covered the following topics briefly...
  - A primer to CAP theorem.
  - Comparing CP and CP systems and their strength/weaknesses.
  - Why you should embrace asynchronous business workflows.
  - How to deal with eventual consistency.

If you or your development team are venturing into building distributed systems or messaging based architectures, this might give you some topics to research about. I recommend you read about CAP theorem and what you gain by going with a CP/AP system. This talk will be a good starting point.

## About API Days

This is the third time I spoke at API Days but the first time doing so internationally. It was an awesome experience to participate and talk at the conference. 

On the website it says

> The Covid-19 pandemic has pushed Indonesian companies to accelerate their adoption of digital tools and business models. Across retail, healthcare, financial services and logistics, connectivity enables companies to continue to serve customers. The enthusiasm of consumers and merchants for marketplaces and digital payments is building a new normal for e-commerce. Apidays is the leading industry tech and business series of conferences in APIs and the programmable economy.

The theme this year was "Accelerating Digitization" and there were multiple tracks. There were also workshops and roundtable discussions as well. You can watch full **[replays of talks here](https://www.youtube.com/playlist?list=PLmEaqnTJ40Or4D_y4OtPPxb6zVINSBweS).**

![Speaker List](/assets/images/apidays/apidays-jakarta-lineup.webp)

## The Shell Game Called Eventual Consistency

The abstract is as follows.

> As we build distributed highly scalable systems the central data store and transactions are no longer a safety net we can afford. In the world of event sourcing and CQRS (Command Query Responsibility Segregation) we need to design clever systems that don't show cracks and seams where eventual consistency is at play. We will tackle those unpleasant invariants and race conditions head on to investigate some technical and non technical smoke and mirror solutions that we can use to deliver a positive experience to end-users while finding the performance sweet spot. <br /><br />We are utilizing the various PaaS/Serverless solutions to build more and more distributed systems. Often these systems need to work together to produce a result. When performance and scalability is of high priority, consistency (CAP theorem) takes a back seat. We still need to find ways to shelter the end-user from these design realities. The aim of this talk is to find ways of doing it. Be it through changing the business process or by doing clever tricks on the front end while giving the backend has a heartbeat to catch up. There are countless ways to do it. My goal is to investigate a few of them and get the conversations happening.

## Recording & Slide deck

<iframe width="560" height="315" src="https://www.youtube.com/embed/uNVQxuGOLw8" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

<br />

<script async class="speakerdeck-embed" data-id="2cc7089f971e4d348ef014fa56bf6db0" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

If you have any thoughts or comments please leave them here. If you've got an interesting way to deal with eventual consistency on the UI, I would love to hear about it too.