## [v3.0.2]
> May  8, 2017

- [#17] - Fix issue with `Image`. ([@jtag05])
- [#16] - Mark jsdom as a peer dependency.

[v3.0.2]: https://github.com/rstacruz/jsdom-global/compare/v3.0.0...v3.0.2

## [v3.0.0]
> May  8, 2017

- [#23] - jsdom-global now requires jsdom v10. ([@GinjiBan])

[v3.0.0]: https://github.com/rstacruz/jsdom-global/compare/v2.1.1...v3.0.0

## [v2.1.1]
> Dec 24, 2016

- [#11] - Fix issues with XMLHttpRequest.

[v2.1.1]: https://github.com/rstacruz/jsdom-global/compare/v2.1.0...v2.1.1

## [v2.1.0]
> Aug 22, 2016

- [#6], [#7] - Fix support for jsdom 9.4.0.

[v2.1.0]: https://github.com/rstacruz/jsdom-global/compare/v2.0.0...v2.1.0

## [v2.0.0]
> May 13, 2016

- [#3] - Allow overriding `html` and `options` being passed to jsdom. ([#5], [@kenjiru])
- Deprecate the undocumented (and never-used) feature of calling `jsdom(function)`.

[v2.0.0]: https://github.com/rstacruz/jsdom-global/compare/v1.7.0...v2.0.0

## [v1.7.0]
> Mar 21, 2016

- Implement `jsdom-global/register` for use in simpler cases.

[v1.7.0]: https://github.com/rstacruz/jsdom-global/compare/v1.6.2...v1.7.0

## [v1.6.2]
> Feb 22, 2016

- Fix typo in browser.js.

[v1.6.2]: https://github.com/rstacruz/jsdom-global/compare/v1.6.1...v1.6.2

## [v1.6.1]
> Jan 15, 2016

- Make `jsdomGlobal()` idempotent - that is, you may call it twice and expect
the same result without any side effects.

[v1.6.1]: https://github.com/rstacruz/jsdom-global/compare/v1.5.0...v1.6.1

## [v1.5.0]
> Jan 12, 2016

- Remove tape integration... we don't need it.

[v1.5.0]: https://github.com/rstacruz/jsdom-global/compare/v1.4.0...v1.5.0

## [v1.4.0]
> Jan 12, 2016

- `tape`: Shows navigator userAgent in tape output.

[v1.4.0]: https://github.com/rstacruz/jsdom-global/compare/v1.3.0...v1.4.0

## [v1.3.0]
> Jan 11, 2016

- Add browserify support.

[v1.3.0]: https://github.com/rstacruz/jsdom-global/compare/v1.2.0...v1.3.0

## [v1.2.0]
> Jan 11, 2016

- Fix compatibility with legacy Node.js versions.

[v1.2.0]: https://github.com/rstacruz/jsdom-global/compare/v1.1.0...v1.2.0

## [v1.1.0]
> Jan 11, 2016

- Add `cleanup()`.

[v1.1.0]: https://github.com/rstacruz/jsdom-global/compare/v1.0.0...v1.1.0

## [v1.0.0]
> Jan 11, 2016

- Initial release.

[v1.0.0]: https://github.com/rstacruz/jsdom-global/tree/v1.0.0
[#3]: https://github.com/rstacruz/jsdom-global/issues/3
[#5]: https://github.com/rstacruz/jsdom-global/issues/5
[#6]: https://github.com/rstacruz/jsdom-global/issues/6
[#7]: https://github.com/rstacruz/jsdom-global/issues/7
[#2]: https://github.com/rstacruz/jsdom-global/issues/2
[#11]: https://github.com/rstacruz/jsdom-global/issues/11
[#16]: https://github.com/rstacruz/jsdom-global/issues/16
[#17]: https://github.com/rstacruz/jsdom-global/issues/17
[#23]: https://github.com/rstacruz/jsdom-global/issues/23
[@kenjiru]: https://github.com/kenjiru
[@ngryman]: https://github.com/ngryman
[@GinjiBan]: https://github.com/GinjiBan
[@jtag05]: https://github.com/jtag05
