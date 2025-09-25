const { DateTime } = require("luxon");

 function latestByFolder(collectionApi, folder) {
    return collectionApi.getAll()
      .filter(item => item.inputPath.startsWith(`./src/${folder}/`))
      .filter(item => item.data.date || item.data.start)
      .sort((a, b) => {
        const aDate = a.data.start || a.data.date;
        const bDate = b.data.start || b.data.date;
        return bDate - aDate;
      });
  }

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("./src/css");
  eleventyConfig.addPassthroughCopy("./src/img");
  eleventyConfig.addPassthroughCopy("./src/admin");
  

  //filtro que devolve no fuso horario japones e calcula se é evento futuro com duração de dia ou horas
  eleventyConfig.addFilter("eventDateJa", (start, end) => {
    if (!start) return "";

    const startDate = DateTime.fromJSDate(start, { zone: "utc" })
      .setZone("Asia/Tokyo")
      .setLocale("ja");

    const endDate = end 
      ? DateTime.fromJSDate(end, { zone: "utc" })
          .setZone("Asia/Tokyo")
          .setLocale("ja") 
      : null;

    if (endDate) {
      if (startDate.hasSame(endDate, "day")) {
        return `${startDate.toFormat("yyyy年M月d日 (ccc) HH:mm")} - ${endDate.toFormat("HH:mm")}`;
      }
      return `${startDate.toFormat("yyyy年M月d日 (ccc) HH:mm")} - ${endDate.toFormat("yyyy年M月d日 (ccc) HH:mm")}`;
    }

    return startDate.toFormat("yyyy年M月d日 (ccc) HH:mm");
  });

  eleventyConfig.addNunjucksFilter("excludeFromCollection", function (collection=[], pageUrl=this.ctx.page.url) {
    return collection.filter(post => post.url !== pageUrl);
  });

  //funcao para pegar as infos fixas e transformar na collection geral
  eleventyConfig.addCollection("geral", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/config/description.md");
  });

  // funcao para estipular limites de conteudos a mostra
  eleventyConfig.addNunjucksFilter("limit", (arr, limit) => {
    return arr?.slice(0, limit);
  });
  
  // Latest para cada seção
  eleventyConfig.addCollection("latestSeminar", api => latestByFolder(api, "seminar"));
  eleventyConfig.addCollection("latestCultural", api => latestByFolder(api, "cultural"));
  eleventyConfig.addCollection("latestInbound", api => latestByFolder(api, "inbound"));
  eleventyConfig.addCollection("latestOutbound", api => latestByFolder(api, "outbound"));
  eleventyConfig.addCollection("latestHLH", api => latestByFolder(api, "hlh"));
  eleventyConfig.addCollection("latestSpecial", api => latestByFolder(api, "special"));


  //funcao para selecionar todas as ultimas postagens e mostrar na sessao updates por ordem de data
  eleventyConfig.addCollection("updates", function (collectionApi) {
    return collectionApi.getAll()
      .filter(item =>
        item.inputPath.startsWith("./src/seminar/") ||
        item.inputPath.startsWith("./src/hlh/") ||
        item.inputPath.startsWith("./src/special/") ||
        item.inputPath.startsWith("./src/outbound/") ||
        item.inputPath.startsWith("./src/inbound/") ||
        item.inputPath.startsWith("./src/cultural/")
      )
      .sort((a, b) => {
        const aDate = a.data.start || a.data.date;
        const bDate = b.data.start || b.data.date;
        return bDate - aDate;
      });
  });

  //funcao para apagar a tag "post" padrao do eleventy e mostrar apenas a tag selecionada
  eleventyConfig.addFilter("filteredTags", function(tags = []) {
    if (!Array.isArray(tags)) return [];
    const hiddenTags = ["post", "posts"];
    return tags.filter(tag => !hiddenTags.includes(tag));
  });

  //funcao que calcula se o evento é futuro ou passado para mostrar na sessão de proximos eventos
  eleventyConfig.addCollection("futureEvents", function (collectionApi) {
    const now = DateTime.now().setZone("Asia/Tokyo");

    return collectionApi.getAll()
      .filter(item => item.data.start)
      .filter(item => {
        const start = DateTime.fromJSDate(item.data.start, { zone: "utc" }).setZone("Asia/Tokyo");
        const end = item.data.end 
          ? DateTime.fromJSDate(item.data.end, { zone: "utc" }).setZone("Asia/Tokyo") 
          : null;
        return end ? end >= now : start >= now;
      })
      .sort((a, b) => a.data.start - b.data.start);
  });
  
  eleventyConfig.setServerOptions({
    middleware: [
      function (req, res, next) {
        if (req.statusCode === 404) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(require("fs").readFileSync("_site/404.html"));
        } else {
          next();
        }
      }
    ]
  });

  return {
    dir: {
      input: "src",
      output: "public",
    },
  };
};
