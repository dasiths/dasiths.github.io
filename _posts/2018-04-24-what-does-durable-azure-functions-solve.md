---
title: "What Does Durable Azure Functions Solve?"
date: 2018-04-24 13:36
comments: true
categories: [serverless]
tags: [.net, azure functions, serverless]
header:
  teaser: /assets/images/azure_functions_featured_image.png
  image: /assets/images/azure_functions_featured_image.png
toc: true
toc_label: "Content"
toc_sticky: false
---
Azure Functions are the way serverless compute is implemented in Azure. Amazon Web Services equivalent is called AWS Lambda. I won't go into detail about what serverless is and what <a href="https://azure.microsoft.com/en-gb/overview/serverless-computing/" target="_blank" rel="noopener">advantages it provides</a> in this post. You can find my learnings from a project where I implemented my web api using Azure Functions <a href="http://dasith.me/2018/01/20/using-azure-functions-httptrigger-as-web-api/" target="_blank" rel="noopener">here</a>.

I will be discussing the Azure Functions V2 (Still in preview at the time of writing this blog) and in particularly the newly introduced durable functions. For a quick comparison of the V1 and V2 runtimes have a look <a href="https://docs.microsoft.com/en-us/azure/azure-functions/functions-versions" target="_blank" rel="noopener">here</a>.


## What are "Durable Functions" in Azure?


Durable functions are an extension to Azure Functions which allows you to write stateful functions. The state management is abstracted away through an async/await and allows you to write orchestration logic in code. The runtime makes sure the state is durable even if the VM running the function in restarted or the function gets recycled.

Before going into detail, let's see what problem durable functions promises to solve. After which you will have a good understanding where this fits in solution design.

Take this simple example.

![function-chaining](/assets/images/function-chaining.png)

We have 4 functions that chain the output from the previous one as the input for the next. This type of orchestration in common in function design.

Before durable functions, there were a couple of ways of solving this.


1.  **Have a separate orchestrator function and let it handle the work flow.**


    *   The orchestrator functions needs to be running the entire duration of the process. This ends up costing more because we have two functions running at the same time.
    *   If the orchestrator function gets recycled or the VM restarted then the current state is lost

2.  **Have queues in between the functions and have the functions be triggered by a queue message.**


    *   Requires a lot of queues and managing the connections/triggers between functions.

When faced with the function chaining problem, I've generally gone with the approach of using queues in the past. Whilst it was painful to do it that way, I got the benefit of the runtime handling situations where a function was recycled and the queue message had to be replayed.


### Where does durable functions fit in this scenario?


Durable functions takes away the problems we had in solution 1. The orchestrator function sleeps while waiting for a child function output and wakes up automatically once an output is received. The runtime also manages the state so we don't have to worry about function recycling or VM restarts.


### How does the code look like?


```csharp

public static async Task Run(DurableOrchestrationContext ctx)
{
    try
    {
/* 

inputs - Orchestration functions support only DurableOrchestrationContext as a
parameter type. Deserialization of inputs directly in the function signature is
not supported. Code must use the GetInput method to fetch orchestrator
function inputs. These inputs must be JSON-serializable types.

outputs - Orchestration triggers support output values as well as inputs. The
return value of the function is used to assign the output value and must be
JSON-serializable. If a function returns Task or void, a null value will be
saved as the output.

*/
        var someInput = context.GetInput();

        var outputF1 = await ctx.CallActivityAsync("Function1", someInput);
        var outputF2 = await ctx.CallActivityAsync("Function2", outputF1);
        var outputF3 = await ctx.CallActivityAsync("Function3", outputF2);
        var outputF4 = await ctx.CallActivityAsync("Function4", outputF3);

        // Log output
        return outputF4;
    }
    catch (Exception)
    {
        // error handling/compensation goes here
    }
}

```


### How does it do it? Magic?


Not really. :) It uses a cloud design pattern called Event Sourcing. I've got a series of blog posts about <a href="http://dasith.me/2016/12/02/event-sourcing-examined-part-1-of-3/" target="_blank" rel="noopener">event sourcing</a> if you're interested.

Durable functions is built on top of the <a href="https://github.com/Azure/durabletask" target="_blank" rel="noopener">Durable Task Framework</a>. When you await the ***DurableOrchestrationContext***, it writes to a 'history table' and exits the function. When an output is ready, it re-runs the function to the point of the await (checkpoint) and injects the value in. Underneath it uses queues to trigger the awakening but that's all abstracted away from you. If you're really interested you can have a peek inside the linked storage account for the auto/runtime generated tables and queues.

You can read more about the technology powering durable functions <a href="https://docs.microsoft.com/en-us/azure/azure-functions/durable-functions-overview#the-technology" target="_blank" rel="noopener">here</a>.


### Any Constraints?


Yes because the orchestrator functions runs multiple times (replay/checkpoint as mentioned above) it is important that the orchestrator function is deterministic. To put it simply, the code must return the same value for the same input.


*   This means you can't generate random numbers or guids.
*   If you're calling remote endpoints those will have to be idempotent.
*   No async/await unless you're awaiting  on the DurableOrchestrationContext.
*   Non blocking (no I/O or Thread.Sleep).
*   Current date/time should be accessed through <a href="https://azure.github.io/azure-functions-durable-extension/api/Microsoft.Azure.WebJobs.DurableOrchestrationContext.html#Microsoft_Azure_WebJobs_DurableOrchestrationContext_CurrentUtcDateTime" target="_blank" rel="noopener">CurrentUTCDateTime</a>.
Full list of constraints can be found <a href="https://docs.microsoft.com/en-us/azure/azure-functions/durable-functions-checkpointing-and-replay#orchestrator-code-constraints" target="_blank" rel="noopener">here</a>.


### Closing Remarks


With durable functions, Microsoft has provided us with the ability to easily orchestrate our serverless functions. This will hopefully encourage more people to use Azure Functions to build their compute logic. I highly recommend you have a look at <a href="https://docs.microsoft.com/en-us/azure/azure-functions/durable-functions-overview" target="_blank" rel="noopener">Microsoft Documentation</a> and other use cases (i.e. Fan Out/ Fan in and Async Http) for durable functions.

If you have any thoughts or comments please leave them here as they help me improve.
