# CRO Development tool

This tool is created for CRO developers to quickly create variations for components on a website.
It works with a local NPM server setup by this tool, and a chrome extension.

## Setting up

Run ```npm i cro-development-tool --save``` to install the server.

While installing there will be some questions in the console to help the setup of your project.
For first time use I would recommend doing these steps to setup some examples, create config file, and add the start script to your package.json.

## Creating CRO variations

To create a new variation you simply need to create a file in your 'customers' tree. This app asumes you work for multiple customers. Every customer can have multiple campaigns / projects, and each campaign can have multiple variations. 

For compatibility with different platforms, it is adviced to use lowercase, and normal folder names. No capitals, strange characters or spaces.
Dashes are replaced with spaces in the chrome extension.

The campaign structure is like this:

```text
- customers <- Main directory. This is configurable in your config.json
    - some-customer <- this level is for customers
        - some-campaign <- this is campaign / project level
            - variation-1 <- this is the variation
                - index.scss <- Styling for variation goes to the index.scss
                - index.js <- JavaScript goes in the index.js
            - variation-2 <- this is the variation
                - index.scss <- Styling for variation goes to the index.scss
                - index.js <- JavaScript goes in the index.js
        - another-campaign <- this is campaign / project level
            - variation-1 <- this is the variation
                - index.scss <- Styling for variation goes to the index.scss
                - index.js <- JavaScript goes in the index.js
            - variation-2 <- this is the variation
                - index.scss <- Styling for variation goes to the index.scss
                - index.js <- JavaScript goes in the index.js
```

## Live reload, and overlay changes on a website

When running ```npm start``` the server with live reload, SCSS compiler, and JS compiler will start. But then you'll need to chrome extension to actually connect to this server, inject your changes and live reload the changes when you change your code.

You can download the extension here: [https://drive.google.com/drive/folders/1B3W1RS3uW5Tbemm3h7wRyRYsxMjNc7U5?usp=sharing](https://drive.google.com/drive/folders/1B3W1RS3uW5Tbemm3h7wRyRYsxMjNc7U5?usp=sharing)

Unpack the ZIP file, and load it in chrome as 'unpacked extension'
