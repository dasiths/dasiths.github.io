---
title: "Requesting Additional Claims From AzureAD"
date: 2019-04-14 12:00
header:
  teaser: /assets/images/azure_ad_additional_claim.png
comments: true
categories: [.net, azure ad, oauth, openidconnect]
tags: [.net, azure ad, oauth, openidconnect]
toc: true
toc_label: "Content"
toc_sticky: true
---

I am currently working on a project that uses [EasyAuth](https://docs.microsoft.com/en-us/azure/app-service/overview-authentication-authorization) to protect a web app hosted on Azure App Services. Think of it as a layer that operates above your web app that handles authentication and then inserts some special headers with the logged in users information. Your backend web application can read these special headers and extract claims about the user.

## The Problem

Out of the box it includes things like `name`, `oid` and `upn` of the logged in user. One thing very noticeably was missing was the `email` claim. It's very tempting to treat the `upn` as the email but they [represent two different things in Azure AD](https://getcloudsavvy.wordpress.com/2017/06/06/upn-email-office-365-user-experience/).

## Solution

![optional claims in app manifest](/assets/images/azure_ad_additional_claim.png)

Lucky for us it's very easy to ask for additional claims from Azure AD. If you haven't already created an `app registration` it's a good time to do it now. (This [post](https://blogs.msdn.microsoft.com/mihansen/2018/03/25/azure-active-directory-authentication-easy-auth-with-custom-backend-web-api/) is a good place to start if you have EasyAuth in the mix). The solution **isn't specific to EasyAuth** though. I have used this method with `ADAL.js` when implementing the [OAuth Implicit Flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/v1-oauth2-implicit-grant-flow) as well.

1. In the Azure Portal open up your app registration.
2. Click `Manifest` and proceed to editing it.
3. Add the following to your `optionalClaims` section.
    ```json
    "optionalClaims": 
   {
        "idToken": [
            {
                "name": "email",
                "source": null,
                "essential": true,
                "additionalProperties": []
            }
        ]
    }
    ```
    A full list of supported claims can be found in the Microsoft [documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-optional-claims). Take note of what claims are supported in Azure AD 1.0 vs 2.0

4. Hit `Save` to persist your changes.
4. Go to your app to test it out. Make sure you log out of any existing session and log back in to force Azure AD to issue an `id token` with the new specified claims. You can use [jwt.io](http://jwt.io) to decode your new id token and inspect the claims to make sure it worked.

    ```json
    "email": "dasith.wijes@mycompany.net", // this is the one
    "family_name": "Wijes",
    "given_name": "Dasith",
    "name": "Dasith Wijes",
    "unique_name": "dasith.wijes@mycompany.net", // that's not it
    "upn": "dasith.wijes@mycompnay.net", // not it either
    "ver": "1.0"
    ```

That's pretty much it. Good luck and happy coding.
