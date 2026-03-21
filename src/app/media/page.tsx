"use client";

import React, { useState, useMemo } from "react";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import MediaFilters from "@/components/media/MediaFilters";
import MediaCard from "@/components/media/MediaCard";
import ResourceList from "@/components/media/ResourceList";
import { recentSermons } from "@/data/sermons";
import { AnimatePresence, motion } from "framer-motion";
import NextImage from "next/image";

export default function MediaPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMedia = useMemo(() => {
    return recentSermons.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.speaker.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab = activeTab === "all" || item.type === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [activeTab, searchQuery]);

  return (
    <main>
      <PageHeader
        title="Media Resources"
        subtitle="Grow in your faith with our collection of sermon videos, audio messages, and spiritual study resources."
        backgroundImage="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2070&auto=format&fit=crop"
      />

      <SectionContainer>
        <div className="space-y-12">
          <MediaFilters
            activeTab={activeTab}
            onTabChange={setActiveTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <AnimatePresence mode="wait">
            {activeTab === "resources" ? (
              <ResourceList key="resources" />
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredMedia.map((item) => (
                  <MediaCard key={item.id} media={item} />
                ))}

                {filteredMedia.length === 0 && (
                  <div className="col-span-full py-32 text-center bg-gray-50 rounded-3xl border border-dashed text-muted-foreground">
                    <p className="text-xl font-medium">
                      No results found matching your search.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setActiveTab("all");
                      }}
                      className="mt-4 text-primary font-bold hover:underline"
                    >
                      Reset all filters
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SectionContainer>

      {/* Blog Teaser Section */}
      <SectionContainer className="bg-gray-50">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
                — LATEST ARTICLES
              </h4>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                Read Inspiring{" "}
                <span className="text-primary">Blog Stories</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Dive deeper into spiritual insights, church news, and
                testimonies of faith on our official blog.
              </p>
            </div>

            <a
              href="https://nlwc.church/blog/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center h-14 px-10 rounded-full bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              Visit Our Blog
            </a>
          </div>

          <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl">
            <div className="relative h-full w-full">
              <NextImage
                src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1000&auto=format&fit=crop"
                alt="Blog Section"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-8 left-8 text-white">
              <span className="text-primary font-bold uppercase tracking-widest text-xs mb-2 block">
                Featured Post
              </span>
              <h3 className="text-2xl font-bold">
                Maintaining Your Joy in Difficult Times
              </h3>
            </div>
          </div>
        </div>
      </SectionContainer>
    </main>
  );
}
