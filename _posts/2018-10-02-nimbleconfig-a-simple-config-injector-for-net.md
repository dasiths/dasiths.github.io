---
title: "NimbleConfig - A Simple Config Injector For .Net"
date: 2018-10-02 23:02
header:
  teaser: /assets/images/assassin-3690300_960_720-e1538485050283.jpg
  image: /assets/images/assassin-3690300_960_720-e1538485050283.jpg
comments: true
categories: [NimbleConfig, Open Source]
tags: [NimbleConfig, Open Source, ConfigInjector]
---

I recently started an open sourced project called NimbleConfig. It is a simple, unambitious, convention-based configuration injector for .NET using IConfiguration (`Microsoft.Extensions.Configuration`) with full support for AspNetCore. 


## A Bit of History

A while back I used a library called <a href="https://github.com/ConfigInjectorContributors/ConfigInjector" target="_blank">ConfigInjector</a> (By <a href="https://uglybugger.org/" target="_blank">Andrew Harcourt</a>) to inject configuration values into my query and command handlers. I didn't want to take a dependency on the static <a href="https://stackoverflow.com/questions/1189364/reading-settings-from-app-config-or-web-config-in-net" target="_blank">ConfigurationManager</a> because it would hinder my unit tests. ConfigInjector worked very well for me.

It's very simple to use.

1. Add the setting to the app/web.config

    ![App.Config](https://dasiths.github.io/assets/images/capture1.png)

1. Define and use the settings as follows.

	```csharp
		public class SimpleSetting : ConfigurationSetting<string>
		{
		}

		// Then use it after injecting it from the constructor
		public class MyCommandHandler
		{
			private readonly SimpleSetting _simpleSetting;

			public MyCommandHandler(SimpleSetting simpleSetting)
			{
				_simpleSetting = simpleSetting;
			}

			public void Handle()
			{
				Console.WriteLine(_simpleSetting.Value)
			}
		}
	```

1. Do this in your startup to magically wire it up to your IOC container

	```csharp

	ConfigurationConfigurator.RegisterConfigurationSettings()
							 .FromAssemblies(assemblies)
							 .RegisterWithContainer(configSetting => RegisterWithYourContainerHere)
							 .DoYourThing()
	```

As you can imagine this makes the dependencies of my command handler very visible. It uses some conventions to scan my app/web.config and hydrate the settings but apart from that, there isn't any magic going around.

You can imagine how easy it is to unit test. You just new up an instance of the setting class, set a mock value and pass it to the constructor of your command handler. It's dead simple.

## The Problem

ConfigInjector only supports full .Net framework at the time of writing this. Also .Net Core has introduced **appsettings.json** files and some better patterns to read those configuration values. **You can either inject hydrated settings using <a href="https://www.c-sharpcorner.com/article/configuration-in-asp-net-core/" target="_blank" rel="noopener">IConfiguration</a> into your handlers or use <a href="https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration/options?view=aspnetcore-2.1" target="_blank" rel="noopener">IOptions</a>.**

While they are both better than a static method, neither of these options are simple or as easy to use as configinjector. You end up writing boilerplate for setting naming conventions or introduce a constants list for setting names. Basically you end up repeating your code whenever you need a new setting.

I spent some time trying to convert the original config injector open source project to NetStandard and gave up. It became very clear that most of the logic around reading settings values have already been solved by the <a href="https://github.com/aspnet/Configuration" target="_blank" rel="noopener">Microsoft.Extensions.Configuration</a> in a far more elegant way. It's also very lightweight and is already a part of the Asp.Net core template project in visual studio.

## The Solution

I decided to leverage it and build a simple config injector on my own. It would concentrate on constructing and hydrating the settings and leave the heavy lifting of reading values to the IConfiguration class. My aim was to support the use cases ConfigInjector already did.

>After about a week of trial and error I managed to get something going. **I called it NimbleConfig and is open source under the MIT license hosted at github <a href="https://github.com/dasiths/NimbleConfig" target="_blank" rel="noopener">https://github.com/dasiths/NimbleConfig </a>**


I decided to support the IOC container <a href="https://github.com/aspnet/DependencyInjection" target="_blank">Microsoft.Extensions.DependencyInjection</a> because it is also a part of a Asp.Net Core template and plays nicely with every other major IOC containers like Autofac, Ninject and StructureMap.

So without further adieu, here are some code samples. Notice how similar the usage is to ConfigInjector.

1. First Install and reference the Nuget

	>NimbleConfig.DependencyInjection.Aspnetcore

1. Then define your settings class as follows

	```csharp
	// Our setting is a string
		public class SomeSetting: ConfigurationSetting<string>;
		{
		}

		// or for a more complex type

		public class SomeComplexSetting : IComplexConfigurationSetting
		{
			public string SomeProperty { get; set; }
		}
	```

1. Add this to your** appsettings.json** file

	```csharp
	   {
			"SomeSetting": "SomeValue",
			"SomeComplexSetting": {
				"SomeProperty": "SomeValue"
			}
		}
	```

1. Inject and use it in your controllers, services etc

	```csharp
		public class ValuesController : ControllerBase
		{
			private readonly SomeSetting _someSetting;
			private readonly SomeComplexSetting _someComplexSetting;

			public ValuesController(SomeSetting someSetting, SomeComplexSetting someComplexSetting)
			{
				_someSetting = someSetting;
				_someComplexSetting = someComplexSetting;
			}

			public ActionResult Get()
			{
				return new string[] {
					_someSetting.Value,
					_someComplexSetting.SomeProperty
				};
			}
		}
	```

1. In the **ConfigureServices()** method in your Startup.cs add the following to scan and inject settings types

	```csharp
		public void ConfigureServices(IServiceCollection services)
		{
			// Other services go here

			// Wire it up using the fluent api
			services.AddConfigurationSettings().AndBuild();
		}
	```

<hr />

You can try this if you have to access some configuration setting prior to setting up the DI container.

```csharp
    // You still need to provide an instance of IConfiguration
    var dirtySetting = configuration.QuickReadSetting();
```

<hr />

## Want More?

See the <a href="https://github.com/dasiths/NimbleConfig/tree/master/Samples" target="_blank" rel="noopener">sample projects</a> for more advanced use cases like complex types, enums and arrays. Checkout the `ConsoleApp` example on how to use it in a non aspnetcore app.

NimbleConfig provides **full customisation** of the setting creation via **lifetime hooks** in `IConfigurationOptions`. This is done via creating your own resolvers for the name (`IKeyName`), reader (`IConfigurationReader`), parser (`IParser`), constructor (`IValueConstructor`).

**Example of setting a prefix using the configuration options lifetime hooks**

```csharp
    var configOptions = ConfigurationOptions.Create()
                            .WithGlobalPrefix("MyAppSettings:") // Adding a global prefix to key names
                            .WithNamingScheme((type, name) => // Resolving type specific key names
                            {
                                if (type == typeof(SomeSetting)) // selectively apply logic
                                {
                                    return new KeyName("AnotherPrefix", name.QualifiedKeyName);
                                }

                                return name; // return the auto-resolved one if no change is needed
                            });

    // Then just pass it in to the builder uisng the fluent api

    services.AddConfigurationSettings()
            .UsingOptionsIn(configOptions)
            .AndBuild();
```

**These fluent apis allow you to easily add your custom logic.** They take a function which accepts a type and the auto-resolved instance as seen in the above example.

*   `.WithNamingScheme()` for setting configuration key names.
*   `.WithReader()` for setting a custom config reader.
*   `.WithParser()` for setting a custom parser.
*   `.WithConstructor()` for setting a custom value constructor.

<hr />

## Where to Next?

I think the project is at a state where it can be used on production systems. It's got feature parity with ConfigInjector and leverages IConfiguration which is a very well maintained repository by Microsoft. I can't really think of anything else to add to the project at this point. It solves a simple problem well. Having said that, there is always room for improvement. I am open to any ideas and suggestions.

I am also always on the lookout for contributors for my open source projects and please feel free to do so. If you have any questions please post them here or raise an issue on the github repo itself.

Thank you.
