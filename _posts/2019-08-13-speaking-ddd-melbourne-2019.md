---
title: "Speaking @ DDD Melbourne 2019"
date: 2019-08-13 22:06
comments: true
header:
  teaser: /assets/images/dddmelb2019main.jpg
categories: [Conference, Authentication]
tags: [dddmelbourne, authentication, security, oauth, openidconnect, public speaking]
---
Last weekend I spoke at [@DDDMelbourne](https://www.dddmelbourne.com/) and it was my first time doing so. The event attracted close to 900 people and had 5 concurrent tracks. I spoke at the [@JuniorDev](https://twitter.com/juniordev_io) channel about `Modern Authentication`.

![Audience](/assets/images/dddmelb2019main.jpg)

DDD Melbourne is an inclusive non-profit conference for the software community.

On the website it says
> Our goal is to create an approachable event that appeals to the whole community, especially people who usually don’t have the opportunity to attend, or speak at, conferences.

My talk was about modern authentication and how to leverage existing trust relationships with social networking web sites and other identity providers. I described the core concepts and then jumped in to a deep dive of JSON Web Tokens. I finished the talk by looking at `OAuth` and `OpenIdConnect` flows like `Implicit Grant`, `Auth Code Grant` and `Client Credentials Grant`. I briefly touched on recent additions to the OAuth 2.0 protocol like [Token Exchange Flow](https://tools.ietf.org/html/draft-ietf-oauth-token-exchange-12) and [Device Code flow](https://tools.ietf.org/html/draft-ietf-oauth-device-flow) as well.

The abstract is as follows.

> There has never been more emphasis in security than in the modern environment of distributed computing and increased sharing of data. Our data does not sit inside silos consumed by one application anymore. In this context the modern distributed applications need to securely access protected resources without having to share passwords. We need scalable solutions that work with things like single page applications. We will dive in and explore terms like `OAuth`, `OpenIdConnect` and `JWT` and how they relate to authentication and authorisation. This presentation hopes to give you a good understanding of what, where and how to get started with the modern approaches to authentication.

You can download the slides from <a href="https://www.slideshare.net/DasithWijesiriwarden/ddd-melbourne-2019-modern-authentication-101-161977250" target="_blank" rel="noopener">here</a>

<iframe src="//www.slideshare.net/slideshow/embed_code/key/teBa6Y4awJ4QJB" width="595" height="485" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" style="border:1px solid #CCC; border-width:1px; margin-bottom:5px; max-width: 100%;" allowfullscreen> </iframe> 

A big thanks for everyone who helped organize this event and the everyone who came to listen to my talk. It was the 10th consecutive year of running DDD Melbourne and everyone seemed to thoroughly enjoy it. If you have any thoughts + feedback about my talk or the event in general please feel free to leave it here or send them my way via twitter @dasiths.
