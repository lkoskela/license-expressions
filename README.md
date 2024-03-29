# license-expressions

This package parses a string representation of an SPDX license describing license terms, like those found in the `package.json` files' `license` fields, into consistently structured ECMAScript objects or JSON for programmatic analysis.


<div id="top"></div>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<h3 align="center">license-expressions</h3>
<p align="center">
    Parsing SPDX license expressions in pure JavaScript (TypeScript).
</p>
<p>
    <a href="https://github.com/lkoskela/license-expressions"><strong>Explore the docs »</strong></a>
    ·
    <a href="https://github.com/lkoskela/license-expressions/issues">Report Bug</a>
    ·
    <a href="https://github.com/lkoskela/license-expressions/issues">Request Feature</a>
</p>


<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation-for-command-line-use">Installation for command line use</a></li>
        <li><a href="#installation-for-programmatic-use">Installation for programmatic use</a></li>
      </ul>
    </li>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#command-line-usage">Command line usage</a></li>
        <li><a href="#programmatic-usage">Programmatic usage</a></li>
      </ul>
    </li>
    <!--
    <li><a href="#roadmap">Roadmap</a></li>
    -->
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>
<!--
-->


<!-- ABOUT THE PROJECT -->
## About The Project

![Command-line usage][product-screenshot]

The SPDX syntax for expressing license terms comes from the [Software Package Data eXchange (SPDX)](https://spdx.org/), a standard from the [Linux Foundation](https://www.linuxfoundation.org/) for shareable data about software package license terms. SPDX aims to make sharing and auditing license data easy, especially for users of open-source software.

There are plenty of NPM packages available for dealing with SPDX license expressions, each with their specific scope and objectives – and, conversely, they all make some assumptions that may or may not suit your purposes. Many of these packages also lack support (types) for TypeScript.

The particular challenge that soon gave birth to `license-expressions` was that libraries such as `spdx-expression-parse` produce a parse tree but require each license identifier to be a known SPDX license.

The objective of `license-expressions` is to support building automation tools that deal with license information in bulk or otherwise without ability to correct sloppy or outright invalid license expressions one by one, for example, when processing hundreds or thousands of direct and transitive dependencies of as part of a software audit.

<p align="right">(<a href="#top">back to top</a>)</p>


<!-- GETTING STARTED -->
## Getting Started

This is an example of how you may give instructions on setting up your project locally.
To get a local copy up and running follow these simple example steps.

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation for command line use

**With a global install from the NPM registry:**

1. Install the NPM package globally
   ```sh
   $ npm install -g license-expressions
   ```

**By cloning the Git repository and installing locally:**

1. Clone the repo
   ```sh
   $ git clone https://github.com/lkoskela/license-expressions.git
   ```
2. Install NPM packages
   ```sh
   $ npm install
   ```
3. Link the CLI entrypoint to your PATH
   ```sh
   $ npm link
   ```

<p align="right">(<a href="#top">back to top</a>)</p>

### Installation for programmatic use

1. Install the `license-expressions` package as a dependency
   ```sh
   $ npm install --save license-expressions
   ```
2. Import the parse function in your code...
   ```js
   const parse = require('license-expressions')
   ```
3. ...or import the whole set:
   ```js
   import { parse, normalize, validate } from 'license-expressions'
   ```

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->

## Usage

### Command line usage

After installing for command-line use, run the `spdx` command and pass an SPDX expression to it for parsing. The `spdx` command will print out a JSON representation of the given SPDX expression, or a JSON object describing the error should the parsing fail for some reason.

   ```sh
   $ npm install -g license-expressions
   $ npm link
   # => the executable `spdx` should now be in your PATH

   $ spdx "GPL-3.0+"
   # => {
   #        "expression": {
   #            "license": "GPL-3.0-or-later"
   #        },
   #        "errors": []
   #    }

   $ spdx "GPL-3.0"
   # => {
   #        "expression": {
   #            "license": "GPL-3.0"
   #        },
   #        "errors": []
   #    }

   $ spdx --upgrade "GPL-3.0"
   # => {
   #        "expression": {
   #            "license": "GPL-3.0-only"
   #        },
   #        "errors": []
   #    }

   $ spdx "MIT OR (Apache-2.0 AND 0BSD)"
   # => {
   #        "expression": {
   #            "conjunction": "or",
   #            "left": {
   #                "license": "MIT"
   #            },
   #            "right": {
   #                "conjunction": "and",
   #                "left": {
   #                    "license": "Apache-2.0"
   #                },
   #                "right": {
   #                    "license": "0BSD"
   #                }
   #            }
   #        },
   #        "errors": []
   #    }

   $ spdx "Invalid license expression"
   # => {
   #        "expression": {
   #            "license": "Invalid license expression"
   #        },
   #        "errors": [
   #            "Unknown SPDX license identifier: \"Invalid license expression\""
   #        ]
   #    }
   ```

### Programmatic usage

Parsing SPDX expressions into a structured object:

   ```js
   import { parse } from 'license-expressions'

   const simple = parse("GPL-3.0+")
   // => { license: 'GPL-3.0-or-later' }

   const compound = parse("MIT OR (Apache-2.0 AND 0BSD)")
   // => {
   //        conjunction: 'or',
   //        left: { license: 'MIT' },
   //        right: {
   //            conjunction: 'and',
   //            left: { license: 'Apache-2.0' },
   //            right: { license: '0BSD' }
   //        }
   //    }
   ```

Rendering a normalized string representation of an SPDX expression:

  ```ts
  import { normalize } from 'license-expressions'

  normalize('  \t  (  MIT   OR Apache-2.0 )\n')
  // => "Apache-2.0 OR MIT"
  ```

Validating an SPDX expression:

  ```ts
  import { validate } from 'license-expressions'

  validate('GPL-2.0 OR BSD-3-Clause')
  // => { valid: true, errors: [] }

  validate('MIT OR Apache-2.0 WITH Autoconf-exception-2.0')
  // => { valid: false, errors: [ "Exception associated with unrelated license: \"Apache-2.0 WITH Autoconf-exception-2.0\"" ] }
  ```


<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

There is currently not much of a roadmap.

The rough idea is to first reach a sufficient level of correctness and robustness within the realm of valid SPDX expressions with valid license identifiers. This is mostly in place already.

The subsequent evolutionary step is to add the ability to correct slightly mistyped or liberal references to valid licenses, i.e. parse an input such as parsing `"Apache 2"` into `{ license: Apache-2.0 }`, or parsing `"Apache2 or MIT"` into `{ conjunction: 'or', left: { license: 'Apache-2.0' }, right: { license: 'MIT } }`. The basics for such corrections are in place with the help of a secondary, looser parser grammar, the `spdx-correct` third-party library, and additional heuristics/corrections implemented in this library.

Right now we're at a phase where all the major functionality is in place and need for change comes primarily from stumbling onto a live example of a license expression that the library doesn't manage to coerce into a valid format while it seems like a feasible thing to do.

<!--
- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3
    - [ ] Nested Feature
-->

See the [open issues](https://github.com/lkoskela/license-expressions/issues) for a full and up to date list of proposed features (and known issues).

<p align="right">(<a href="#top">back to top</a>)</p>


<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement". Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Once you feel good about the contribution, its tests all pass (`npm test`) and test coverage looks good, go ahead and open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the MIT License. See [LICENSE][license-url] for more information.

The Linux Foundation and its contributors license the SPDX standard under the terms of [the Creative Commons Attribution License 3.0 Unported (SPDX: "CC-BY-3.0")](http://spdx.org/licenses/CC-BY-3.0). "SPDX" is a United States federally registered trademark of the [Linux Foundation](https://www.linuxfoundation.org/). The authors of this package license their work under the terms of the [MIT License](https://spdx.org/licenses/MIT.html).

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Lasse Koskela - [@lassekoskela](https://twitter.com/lassekoskela) on Twitter or the same at gmail.com

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Othneil Drew](https://github.com/othneildrew) for the [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/lkoskela/license-expressions.svg?style=for-the-badge
[contributors-url]: https://github.com/lkoskela/license-expressions/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/lkoskela/license-expressions.svg?style=for-the-badge
[forks-url]: https://github.com/lkoskela/license-expressions/network/members
[stars-shield]: https://img.shields.io/github/stars/lkoskela/license-expressions.svg?style=for-the-badge
[stars-url]: https://github.com/lkoskela/license-expressions/stargazers
[issues-shield]: https://img.shields.io/github/issues/lkoskela/license-expressions.svg?style=for-the-badge
[issues-url]: https://github.com/lkoskela/license-expressions/issues
[license-shield]: https://img.shields.io/github/license/lkoskela/license-expressions.svg?style=for-the-badge
[license-url]: https://github.com/lkoskela/license-expressions/blob/master/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/lassekoskela
[product-screenshot]: images/screenshot.png
