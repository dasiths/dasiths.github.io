---
title: "Lessons learned from doing EdgeDevOps (GitOps) in the bush, air and underwater - API Days Australia 2022"
date: 2023-01-06 22:06
comments: true
header:
  teaser: /assets/images/apidays/teaser-2022.png
categories: [Conference, Edge, DevOps, Distributed Systems]
tags: [apidays, devops, edge, distributed systems, public speaking]
toc: true
toc_label: "Content"
toc_sticky: false
---
I recently spoke at [API Days Australia](https://www.apidays.global/australia/) about my experiences building distributed systems and some challenges my team faced deploying and running them on the edge.

It is not an exaggeration to say that most modern systems that teams build are running on the cloud in a distributed architecture. There are some well-known successful practices around DevOps for these cloud native solutions as well. But what happens when you want to use the same workflows to deploy and run on the edge where connectivity might be intermittent or not available (air gapped systems)? 

How do we run Kubernetes on the edge and use our favourite GitOps workflows? In this talk we spoke about some of the techniques and practices we have been using to build and run workloads on Azure Edge and other edge devices. During this talk we elaborated on the challenges faced running Kubernetes on the edge and some practical solutions, starting off from your development environment, to continuously having your code deployed and running on a fleet of devices in an automated way regardless if it's a mobile platform, drone or a submarine.

My team at Microsoft CSE (Commercial Software Engineering) have been building software that run on Kubernetes on the edge. This has posed a plethora of challenges and edge cases for us to solve. 

In this talk we dived in to the best practices and practical solutions we have discovered along the way. This will help any team building software systems to run on edge devices that have intermittent connectivity or no connectivity (air gapped).

## About API Days

This is the fifth time I spoke at API Days and I wanted to get my dev crew from the [Microsoft Commercial Software Engineering](https://microsoft.github.io/code-with-engineering-playbook/CSE/) involved in the talk. So I reached out to the organising committee and they gave us the green light to present this as a team. We were thrilled as this was the first in person conference for us since the Covid restrictions. We hope you liked the format we presented it in.

## Recording & Slide deck

<iframe width="1280" height="720" src="https://www.youtube.com/embed/PYpHWBQapSs" title="Apidays Australia 2022 - Lessons from doing EdgeDevOps (GitOps) in the bush, air, and underwater." frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<br />

<iframe class="speakerdeck-iframe" frameborder="0" src="https://speakerdeck.com/player/4d51700c463744cfa01e212c3d8c0930" title="Lessons learned from doing EdgeDevOps (GitOps) in the bush, air and underwater - API Days Australia 2022" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true" style="border: 0px; background: padding-box padding-box rgba(0, 0, 0, 0.1); margin: 0px; padding: 0px; border-radius: 6px; box-shadow: rgba(0, 0, 0, 0.2) 0px 5px 40px; width: 560px; height: 314px;" data-ratio="1.78343949044586"></iframe>

<br /><br />

If you have any thoughts or comments please leave them here. Thanks for taking the time to read this post.