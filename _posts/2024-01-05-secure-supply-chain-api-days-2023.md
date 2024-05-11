---
title: "Building Trust Brick by Brick: Exploring the Landscape of Modern Secure Supply Chain Tools - API Days Australia 2023"
date: 2024-01-05 22:06
comments: true
header:
  teaser: /assets/images/apidays/api-days-australia-2023-teaser.png
categories: [Conference, Secure Software Supply Chain, Security, Container]
tags: [apidays, devops, security, supply chain, ssc, containers, oci, public speaking]
toc: true
toc_label: "Content"
toc_sticky: true
---

I presented some my learnings around modern software supply chain security tools and landscape at [API Days Australia 2023](https://www.apidays.global/australia/) and [K8SUG](https://www.meetup.com/k8s-au/) Meetup in November. 

I had my team co-present the topic with me this time. My team in Microsoft [Industry Solution Engineering](https://microsoft.github.io/code-with-engineering-playbook/ISE/) have been building solutions to enable government and defence customer teams in Australia and secure software supply chains have been the main focus.

With the renewed focus supply chains attacks and with the [supply chain security endorsement by the White House](https://www.whitehouse.gov/briefing-room/presidential-actions/2021/05/12/executive-order-on-improving-the-nations-cybersecurity/), every government industry and adjacent vendors are looking at making their own software supply chain more secure. Australia being a close ally of the US and with more recently with [AUKUS](https://en.wikipedia.org/wiki/AUKUS), the industry here is looking to the US for patterns and practices.

It's in this landscape that my team and I were trying to bring the modern approaches and practices to customers here in Australia. We saw many open source community and the k8s ecosystem move in the direction of artefact signing and attestations and wanted to talk more about how everyone can benefit from the industry push for software supply chain security.

In this talk we try to introduce teams to the concept of supply chain security and what you can start doing today to make your supply chain secure and how you can make the distribution and consumption of your software more secure for your consumers as well.

The talk abstract is as follows.

> In the rapidly evolving landscape of software development, open source dependencies have become the building blocks of modern applications, enabling rapid innovation and collaboration. However, this newfound efficiency comes with inherent risks, as the supply chain for software becomes increasingly complex and vulnerable to various threat vectors. In "Building Trust Brick by Brick: Exploring the Landscape of Modern Secure Supply Chain Tools," we embark on a captivating journey through the critical importance of secure supply chains in the software development lifecycle. Join us as we delve into the challenges posed by open source dependencies and the innovative tools that have emerged to address them. We live in a Kubernetes world. As more and more workloads are run on Kubernetes, it becomes essential that every dependency that contributes to compiling, building, and running workloads need to come under the scanner. We will explore tools that allow you to build a chain of trust from source code to running container instances During this talk, we will explore how the convergence of software development and secure supply chains has become paramount in instilling confidence and mitigating risks. We will examine the threat vectors that jeopardize the integrity of the software supply chain and highlight the need for comprehensive security measures.

## About API Days

This is the sixth time I've presented at API Days in the "platform" stream and I'm really grateful from the opportunity to share my learning with the community for such and extended period of time. I've been covering many facets of distributed systems and things like the container ecosystem for a while now.

This year the API days conference was held in the Pullman Melbourne hotel and had 5 parallel tracks and workshops. I believe it was the most attended API days Australia event in its short history.

## About K8SUG - Australia

The [k8s user group](https://www.meetup.com/k8s-au/) meets roughly once a month to discuss the latest and greatest topics around the k8s landscape. This was my first time presenting at the meetup and I got the chance to network with many k8s enthusiasts.

![Meetup](/assets/images/k8sug-November-2023.png)

From their meetup page:
> This is a group for anyone interested in Kubernetes from anywhere to join online or in-person in Melbourne, Australia. We meet to talk about anything Kubernetes / OpenShift related including but not limited to how to Build, Secure, Operate, Manager Kubernetes Clusters, how to Secure and Backup containers, Migrate containers between On-Premises and across Multi-Cloud, how the DR works for the containers etc. Any one is using or planning to adopt Kubernetes should join us to either learn or share the experiences on Kubernetes. It can be vanilla Kubernetes or any managed Kubernetes or OpenShift either OnPrem or in the Public or Private Cloud.

## Recording & Slide deck

<iframe class="speakerdeck-iframe" frameborder="0" src="https://speakerdeck.com/player/e8c00bf15ce94597bf89294efdb6c5e9" title="Building Trust Brick by Brick: Exploring the Landscape of Modern Secure Supply Chain Tools" allowfullscreen="true" style="border: 0px; background: padding-box padding-box rgba(0, 0, 0, 0.1); margin: 0px; padding: 0px; border-radius: 6px; box-shadow: rgba(0, 0, 0, 0.2) 0px 5px 40px; width: 100%; height: auto; aspect-ratio: 560 / 315;" data-ratio="1.7777777777777777"></iframe>

### Short Version from API Days
<iframe width="560" height="315" src="https://www.youtube.com/embed/n7noS4pLb0U?si=BpFq3fVqtzDccU_C" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

### Extended Version from K8SUG

<iframe width="560" height="315" src="https://www.youtube.com/embed/pMq2ylRzYl4?si=-YPv8pScMWGhZ3uN&amp;start=2359" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

</br></br>
If you have any thoughts or comments please leave them here. Thanks for taking the time to read this post.