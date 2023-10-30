# reCAPTHCA

![reCAPTHCA logo](reCAPTHCA_small.png)

Completely Automated Public Turing test to tell Headhunting software 
and potential Clients Apart

Not to be confused with [reCAPTCHA](https://www.google.com/recaptcha/about/)

## About

I made this mostly as a little [portfolio piece](https://wouterkuijper.com/)

Whereas most CAPTCHAs try to be as frictionless as possible, here I intentionally 
introduced a little more friction, but I tried to do so in a playful way, while showing 
a little bit about my professional background, at the same time.

One nice consequence is that, in contrast to frictionless CAPTCHAs, reCAPTHCA does not 
use any cookies, profiling or behavioral analysis.

## Compiling and Testing

Clone the repository or download a zipfile and extract the source files from there.

Install [typescript](https://www.typescriptlang.org/) and compile the source files by 
running:

```shell
tsc
```

Install a local webserver, for example [mongoose](https://mongoose.ws/), or install 
[node](https://nodejs.org/) and do:

```shell
npm install -g npx
npx http-server
```

Start a browser, find the address your local webserver is bound to and open: `test.html`

