import pluginWebc from "@11ty/eleventy-plugin-webc";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

export default function (eleventyConfig) {
  // Add WebC plugin
  eleventyConfig.addPlugin(pluginWebc, {
    components: ["src/_components/**/*.webc"],
  });

  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp", "jpeg"],
    urlPath: "/assets/images/",
    htmlOptions: {
      imgAttributes: {
        loading: "lazy",
        decoding: "async",
      },
    },
  });

  eleventyConfig.addWatchTarget("src/**/*.webc");

  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");

  eleventyConfig.setTemplateFormats("webc");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
    },
  };
}
