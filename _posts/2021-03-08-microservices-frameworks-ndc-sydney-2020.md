---
title: "Not All \"Microservices Frameworks\" Are Made The Same - NDC Sydney 2020"
date: 2021-03-08 22:06
comments: true
header:
  teaser: /assets/images/ndc-sydney-talk.jpg
categories: [Conference, Microservices, Distributed Systems]
tags: [ndc, microservices, distributed systems, public speaking]
toc: true
toc_label: "Content"
toc_sticky: true
---
Last October I spoke at [NDC Sydney](https://ndcsydney.com/) about the pitfalls associated with microservices frameworks and how you can still leverage libraries and runtimes to help with distributed system complexities. In my experience, microservices frameworks tend to give diminishing results as your project evolves and even makes your team less agile and productive. Microservices are an architectural style and frameworks tie you down to a lot of opinions that do not age well.

This is my first time speaking at NDC and due to the pandemic it was hosted in an online format. It had some awesome workshops as well as talks from industry experts sharing their knowledge.

I touched on the following topics during the talk...
  - The definitions for frameworks, libraries and runtimes and why that matters.
  - How frameworks hinder agility and creative thinking among development teams.
  - Why you should still leverage runtimes to solve distributed system complexities.

If your team is currently developing distributed systems or plan to develop microservices like architecture in the future I highly recommend you have a look and try to apply some of the concept to your own context. At least it might give you a shortlist of things to consider before making a jump to a framework. 

## About NDC Conferences

On the website it says

> Since its start-up in Oslo 2008, the Norwegian Developers Conference (NDC) quickly became one of Europe`s largest conferences for .NET & Agile development. Today NDC Conferences are 5-day events with 2 days of pre-conference workshops and 3 days of conference sessions. <br /><br /> The 5th NDC Sydney will be hosted online due to COVID-19. NDC Sydney is a five-day event with the same format as its European sisters NDC Oslo and NDC London. <br /><br /> The conference will feature 5 tracks covering topics such as:<br /><br />    .NET - Agile - C++ - Cloud - Database - Design - DevOps - Embedded - Front-End Framework - Fun - Functional Programming - Gadgets - Internet of Things - JavaScript - Microsoft - Mobile - People - Programming Languages - Security - Techniques - Testing - Tools - UX – Web and more.

## Building distributed systems on the shoulders of giants

The abstract is as follows.

> Developing a distributed system is hard. Understanding the domain is harder. Therefore it makes sense not to reinvent the wheel and use ready made solutions to help build your microservices right? or does it? Turns out the there is a lot to consider here. We will look at how to leverage the right tools to help you achieve a good outcome and a sustainable growth path. We will also explore strategies to not get locked in “frameworks” that only give you short term wins. We will see how our choices can have a long lasting impact and what to consider when making them. <br /><br /> Many developers make the mistake to locking themselves into frameworks that give them an easy win upfront. But as the software solution evolves you end up developing around the quirks of the framework rather than let the domain dictate the architecture. This eventually leads to un sustainable systems that make the domain harder to understand and reason with, making feature development painfully slow. I want to discuss ways to avoid this by picking "frameworks" that don't dictate how you solve business problems as oppose to being a tool or a layer which operates under the domain. Further I'll touch on the bad aspects of vendor lock-in and how to pick the tools that gives you the freedom to run on any cloud vendor.

## Recording & Slide deck

<iframe width="560" height="315" src="https://www.youtube.com/embed/4oSDZI4oiAw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

<script async class="speakerdeck-embed" data-id="966c93d11f88426fb7ad5e81c4a725e0" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

If you have any thoughts or comments please leave them here. I would love to hear about your experience using "microservices frameworks" to implement a microservices architecture.