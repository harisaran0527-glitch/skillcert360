import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "SkillCert 360",
        short_name: "SkillCert 360",
        description:
            "SkillCert 360 - Student Skill Learning, Assessment and Certification Platform",

        start_url: "/",
        scope: "/",

        display: "standalone",

        background_color: "#020617",
        theme_color: "#020617",

        icons: [
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "any",
            },
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "maskable",
            },
        ],
    };
}