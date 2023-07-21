---
title: "What is ORAS and why should you care?"
date: 2023-06-04 22:06
comments: true
header:
  teaser: /assets/images/oras_page_header.png
categories: [Containers, Kubernetes, OCI, Secure Supply Chain]
tags: [containers, docker, oci, k8s, kubernetes, secure-supply-chain]
toc: true
toc_label: "Content"
toc_sticky: true
---

## Intro to OCI

You have no doubt heard of Docker and containers. Since [Docker donated their technology to the open source community](https://www.informationweek.com/cloud/open-container-initiative-finds-footing-in-linux-foundation), a large community of people including tech giants have come together to make containers the defacto unit of software delivery.

The [Open Container Initiative (OCI) was launched in 2015 by Docker](https://opencontainers.org/about/overview/) and other industry leaders as an open governance structure project. Over the years Docker has [kept donating more stuff](https://www.docker.com/blog/donating-docker-distribution-to-the-cncf/) to the open source community.

But [OCI is not a replacement for Docker](https://www.docker.com/blog/demystifying-open-container-initiative-oci-specifications/). Docker is a platform while OCI exists with the sole purpose of creating open industry standards around container formats and runtimes.

From the OCI website: https://opencontainers.org/about/overview/
> The OCI currently contains three specifications: the Runtime Specification (runtime-spec), the Image Specification (image-spec) and the Distribution Specification (distribution-spec).

Over the years OCI have defined their own specification and standards to support various technical and business needs.

## Comparing Docker Image v2 schema 2 vs OCI 1.0 Image schema

- [Docker image manifest spec](https://docs.docker.com/registry/spec/manifest-v2-2/#example-image-manifest)
- [OCI image manifest spec](https://github.com/opencontainers/image-spec/blob/v1.0/manifest.md#example-image-manifest)

[![Docker vs OCI image manifest](/assets/images/docker_vs_oci_image_manifest.png)](/assets/images/docker_vs_oci_image_manifest.png)
*Click to enlarge*.

As you can observe the key differences are just in the `mediaType` fields. In stead of the `application/vnd.docker.*` the OCI spec has `application/vnd.oci.*`. The OCI spec additionally supports annotations as well.

### Same story with the Index Manifest

The image index (fat manifest) is a higher-level manifest which points to specific image manifests, ideal for one or more platforms. This is useful when [storing multi architecture images](https://learn.microsoft.com/en-us/azure/container-registry/push-multi-architecture-images#manifest-list).

- [Docker manifest list spec](https://docs.docker.com/registry/spec/manifest-v2-2/#manifest-list)
- [OCI image index spec](https://github.com/opencontainers/image-spec/blob/v1.0/image-index.md)

I won't do a side by side comparison here but you will see the same differences in `mediaType` there as well.

## That's great for images, but what about other artefacts?

We live in a container world, in fact [we live in a Kubernetes world](https://community.f5.com/t5/technical-articles/it-s-a-kubernetes-world-and-i-m-just-living-in-it/tac-p/313021). So container registries have become paramount in this eco system.

But your software system might not just be composed of container images. What about thing like Helm Charts? You may also have files or other supply chain assets like [SBOMs](https://en.wikipedia.org/wiki/Software_supply_chain) as well.

If you need those files inside your k8s cluster, you used to have 2 options.
- Store the file in some blob storage and allow the cluster to pull it down as required. But what about edge and disconnected scenarios?
- Store your file inside a container image and store it in a container registry. At least this way the dependencies are in the same place the container image. But this feels like cheating.

As the world kept moving more and more workloads to k8s, the industry realized **we need a way to store more than container images in container registries and we needed to support that as a first class concept.**

Think about it, the container registry is the best place to store it. Thing can be versioned and the inherent nature of the registry where manifests and blob content can be stored separately made it ideal.

**Container registries needed to metamorphosize into artefact registries.**

Steve Lasker makes this argument more eloquently than I did.

<iframe width="560" height="315" src="https://www.youtube.com/embed/BpKF_0M37-0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

## Enter OCI v1.1 Specification

With OCI v1.1 spec we finally [got support for artefacts](https://github.com/opencontainers/image-spec/blob/main/manifest.md#guidelines-for-artifact-usage) as a first class concept.

> Content other than OCI container images MAY be packaged using the image manifest. When this is done, the `config.mediaType` value MUST be set to a value specific to the artifact type or the empty value. If the `config.mediaType` is set to the empty value, the `artifactType` MUST be defined. If the artifact does not need layers, a single layer SHOULD be included with a non-zero size. The suggested content for an unused `layers` array is the [empty descriptor](https://github.com/opencontainers/image-spec/blob/main/manifest.md#guidance-for-an-empty-descriptor).

- an [image].`artefactType` field was also introduced.
  > This OPTIONAL property contains the type of an artifact when the manifest is used for an artifact. This MUST be set when `config.mediaType` is set to the [empty value](https://github.com/opencontainers/image-spec/blob/main/manifest.md#guidance-for-an-empty-descriptor). If defined, the value MUST comply with RFC 6838, including the [naming requirements](https://tools.ietf.org/html/rfc6838#section-4.2) in its section 4.2, and MAY be registered with [IANA](https://www.iana.org/assignments/media-types/media-types.xhtml). Implementations storing or copying image manifests MUST NOT error on encountering an artifactType that is unknown to the implementation.

- This meant artefact authors could now leverage the existing `image manifest` to store artefacts in a way that works with the Content Addressable Storage (CAS) capabilities of [OCI Distribution](https://github.com/opencontainers/distribution-spec/blob/main/spec.md).

- The OCI image manifest 1.1 spec also introduced the `subject` field.
  > This OPTIONAL property specifies a [descriptor](https://github.com/opencontainers/image-spec/blob/main/descriptor.md) of another manifest. This value, used by the [`referrers` API](https://github.com/opencontainers/distribution-spec/blob/main/spec.md#listing-referrers), indicates a relationship to the specified manifest.

  This would allow artefacts/manifests to be linked. i.e. An SBOM could be linked/attached to the container image it represented.

- The OCI Distribution Spec 1.1 also introduced the [Referrers API](https://github.com/opencontainers/distribution-spec/blob/main/spec.md#listing-referrers). This allowed clients to query for related artefacts.

### Not All Good News Though

- The use of the `config.mediaType` was not ideal. the ideal field would have been [image].`mediaType` (top-level) but for backwards compatibility reasons they could not. More about that in [this post by Dan Lorenc here](https://dlorenc.medium.com/oci-artifacts-explained-8f4a77945c13).

- This resulted in a lot of artefacts implementations simply leaving the `[image].mediaType` empty and relying on the config blob to be set to a custom type. Not all the registries supported this or had limits on what type of values were supported.

## Pushing This Further With ORAS

The [ORAS (OCI Registry As Storage)](https://oras.land/) project aims to "Distribute Artifacts Across OCI Registries With Ease".

The following is from the "Comparing the ORAS Artifact Manifest and OCI Image Manifest" [section](https://github.com/oras-project/artifacts-spec/blob/main/README.md#comparing-the-oras-artifact-manifest-and-oci-image-manifest).

> OCI Artifacts defines how to implement stand-alone artifacts that can fit within the constraints of the image-spec. OCI Artifacts uses the `manifest.config.mediaType` to identify the artifact is something other than a container image. While this validated the ability to generalize the **C**ontent **A**ddressable **S**torage (CAS) capabilities of [OCI Distribution](https://github.com/opencontainers/distribution-spec), a new set of artifacts require additional capabilities that aren't constrained to the image-spec. ORAS Artifacts provide a more generic means to store a wider range of artifact types, including references between artifacts.

>The addition of a new manifest does not change, nor impact the `image.manifest`.
By defining the `artifact.manifest` and the `referrers/` api, registries and clients opt-into new capabilities, without breaking existing registry and client behaviour. 

The high-level differences between the `oci.image.manifest` and the `oras.artifact.manifest`:

| OCI Image Manifest | ORAS Artifacts Manifest |
|-|-|
| `config` REQUIRED | `config` OPTIONAL as it's just another entry in the `blobs` collection with a config `mediaType` |
| `layers` REQUIRED | `blobs` are OPTIONAL, which were renamed from `layers` to reflect general usage |
| `layers` ORDINAL | `blobs` are defined by the specific artifact spec. For example, Helm utilizes two independent, non-ordinal blobs, while other artifact types like container images may require blobs to be ordinal |
| `manifest.config.mediaType` used to uniquely identify artifact types. | `manifest.artifactType` added to lift the workaround for using `manifest.config.mediaType` on a REQUIRED, but not always used `config` property. Decoupling `config.mediaType` from `artifactType` enables artifacts to OPTIONALLY share config schemas. |
| | `subject` OPTIONAL, enabling an artifact to extend another artifact (SBOM, Signatures, Nydus, Scan Results)
| | `/referrers` api for discovering referenced artifacts, with the ability to filter by `artifactType` |
| | Lifecycle management defined, starting to provide standard expectations for how users can manage their content |

For more info, see:
- [Proposal: Decoupling Registries from Specific Artifact Specs #91](https://github.com/oras-project/artifacts-spec/discussions/91)
- [Discussion of a new manifest #41](https://github.com/opencontainers/artifacts/discussions/41)

### ORAS Artefact Manifest

The ORAS Artifact manifest is similar to the OCI image manifest, but removes constraints defined on the image-manifest such as a required config object and required & ordinal layers

ORAS artefact manifest introduced their own `mediaType` field with the value `application/vnd.cncf.oras.artifact.manifest.v1+json`

Full spec can be [found here](https://github.com/oras-project/artifacts-spec/blob/main/artifact-manifest.md).

## ORAS Artefact Spec Future

There are no future releases or work items planned.

> The output of this project has been proposed to the [OCI Reference Types Working Group](https://github.com/opencontainers/wg-reference-types). Future discussions about artifacts in OCI registries should happen in the [OCI distribution-spec](https://github.com/opencontainers/distribution-spec) & [image-spec](https://github.com/opencontainers/image-spec) repositories.

The idea is to get the proposed changes adopted via the OCI spec and make the artefact use common across all registries and clients.

## ORAS Use Cases And Adopters
- [Helm](https://v3.helm.sh/docs/topics/registries/): Store packages.
- [Project Singularity](https://docs.sylabs.io/guides/3.1/user-guide/cli/singularity.html): Store Singularity Images.
- [Notation](https://github.com/notaryproject/notation): Store Signature used in secure supply chain.
- [WASM to OCI](https://github.com/engineerd/wasm-to-oci) - Store WebAssembly modules in OCI registries.

A full list can be [found here](https://oras.land/docs/category/oras-commands/).

### Supply Chain Artefacts

There are some examples below on how to use ORAS to store supply chain artefacts and sign them using Notation.

- [CNCF Webinar - Secure Container Supply Chain with Notation, ORAS, and Ratify](https://www.youtube.com/watch?v=7RvFj_RWE7c&ab_channel=CNCF%5BCloudNativeComputingFoundation%5D)
- [Push and pull OCI artifacts using an Azure container registry](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-oci-artifacts)
- [Push and pull supply chain artifacts using Azure Registry (Preview)](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-oras-artifacts)
- [Build, sign, and verify container images using Notary and Azure Key Vault (Preview)](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-tutorial-sign-build-push)

## Using ORAS CLI

To install ORAS CLI on Linux:
```bash
VERSION="1.0.0"
curl -LO "https://github.com/oras-project/oras/releases/download/v${VERSION}/oras_${VERSION}_linux_amd64.tar.gz"
mkdir -p oras-install/
tar -zxf oras_${VERSION}_*.tar.gz -C oras-install/
sudo mv oras-install/oras /usr/local/bin/
rm -rf oras_${VERSION}_*.tar.gz oras-install/
```

Other platforms are [listed here](https://oras.land/docs/installation).

You will need an compatible registry like [Zot](https://zotregistry.io/). A list of [supported registries](https://oras.land/docs/adopters) are listed here.

To run `Zot`:
```bash
docker run -d -p 5000:5000 --name oras-quickstart ghcr.io/project-zot/zot-linux-amd64:latest
```

Create a sample file:
```bash
echo "hello world" > artifact.txt
```

Push the artefact:
```bash
oras push --plain-http localhost:5000/hello-artifact:v1 \
    --artifact-type application/vnd.acme.rocket.config \
    artifact.txt:text/plain

Uploading a948904f2f0f artifact.txt
Uploaded  a948904f2f0f artifact.txt
Pushed [registry] localhost:5000/hello-artifact:v1
Digest: sha256:bcdd6799fed0fca0eaedfc1c642f3d1dd7b8e78b43986a89935d6fe217a09cee    
```

Attach an artefact:
```bash
echo "hello world" > hi.txt
oras attach --artifact-type doc/example localhost:5000/hello-artifact:v1 hi.txt
```

Pull an artefact:
```bash
oras pull localhost:5000/hello-artifact:v1

Downloading a948904f2f0f artifact.txt
Downloaded  a948904f2f0f artifact.txt
Pulled [registry] localhost:5000/hello-artifact:v1
Digest: sha256:19e1b5170646a1500a1ac56bad28675ab72dc49038e69ba56eb7556ec478859f
```

Discover the referrers:
```bash
oras discover localhost:5000/hello-artifact:v1

Discovered 1 artifact referencing v1
Digest: sha256:327db68f73d0ed53d528d927a6703c00739d7c1076e50762c3f6641b51b76fdc

Artifact Type   Digest
doc/example     sha256:bcdd6799fed0fca0eaedfc1c642f3d1dd7b8e78b43986a89935d6fe217a09cee
```

- ORAS commands are [listed here](https://oras.land/docs/category/oras-commands/).
- More use cases and custom manifest configs are [covered here](https://oras.land/docs/category/how-to-guides).

## Closing

Hope this post gave you a deeper understanding of the state of artefacts in container registries and how the OCI 1.1 spec and projects like ORAS are trying to push the industry in a direction that allows for standardised registries and clients.

If you have any feedback or questions, please reach out to me on twitter @dasiths or post them here.

Happy coding.