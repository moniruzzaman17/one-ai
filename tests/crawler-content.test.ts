import { describe,expect,it } from "vitest";
import { discoverApiPaths,extractJsonText } from "@/lib/knowledge/crawler";

describe("dynamic catalog discovery",()=>{
  it("discovers same-site API paths used by JavaScript storefronts",()=>{
    expect(discoverApiPaths(`fetch(build("/api/products/")); fetch('/api/categories/')`))
      .toEqual(["/api/products/","/api/categories/"]);
  });

  it("turns product JSON and HTML descriptions into searchable text",()=>{
    const text=extractJsonText({results:[{name:"Travelpack Pro",price:"1499.00",description:"<p>Fits a laptop</p>"}]});
    expect(text).toContain("name: Travelpack Pro");
    expect(text).toContain("price: 1499.00");
    expect(text).toContain("description: Fits a laptop");
  });
});
