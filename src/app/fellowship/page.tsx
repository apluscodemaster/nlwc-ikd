"use client";

import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import { fellowshipCenters } from "@/data/centers";
import { motion } from "framer-motion";
import {
  MapPin,
  MessageCircle,
  Home,
  ExternalLink,
  FileText,
  User,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function FellowshipPage() {
  return (
    <main>
      <PageHeader
        title="House Fellowship"
        subtitle="Connect with a family of believers near you. Our house fellowship centers are places of deep fellowship, prayer, and spiritual growth."
        backgroundImage="https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop"
      />

      <SectionContainer>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h4 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">
            — FIND A CENTER
          </h4>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Fellowship Centers <span className="text-primary">Near You</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Our centers are spread across Ikorodu to ensure that every member of
            the congregation has a close-knit community where they can
            fellowship and grow spiritually together
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
          {fellowshipCenters.map((center, index) => (
            <motion.div
              key={center.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full border-none shadow-xl shadow-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Home className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                      {center.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-primary mt-1 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Address
                          </p>
                          <p className="text-gray-700 font-medium">
                            {center.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-primary mt-1 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Coordinator
                          </p>
                          <p className="text-gray-700 font-medium">
                            {center.coordinator}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-primary mt-1 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Meeting Time
                          </p>
                          <p className="text-gray-700 font-medium">
                            {center.meetingTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row gap-2 pt-4">
                    <Link
                      href={center.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-12 rounded-xl bg-gray-50 text-gray-900 text-xs sm:text-sm font-bold hover:bg-primary hover:text-white transition-all border border-gray-100 shadow-sm flex items-center justify-center gap-1.5 px-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Get Directions
                    </Link>
                    <Link
                      href={center.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-12 rounded-xl bg-green-50 text-green-700 text-xs sm:text-sm font-bold hover:bg-green-600 hover:text-white transition-all border border-green-100 shadow-sm flex items-center justify-center gap-1.5 px-2"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Contact Coordinator
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </SectionContainer>

      {/* Join Section */}
      <SectionContainer className="bg-gray-50">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Couldn&apos;t find a center nearby?
          </h2>
          <p className="text-xl text-muted-foreground">
            We are continually exploring new locations for our House Fellowship
            centers. If you cannot find one close to you, please contact us and
            share your location so we can consider starting one in your area.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="https://wa.me/2347066644051"
              className="h-14 px-10 rounded-full bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2"
            >
              Contact General Coordinator
            </Link>
            {/* <a
              href="https://nlwc.church/fellowship-guidelines"
              target="_blank"
              rel="noopener noreferrer"
              className="h-14 px-10 rounded-full border border-gray-200 bg-white font-bold hover:bg-primary/5 transition-all flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Center Guidelines
            </a> */}
          </div>
        </div>
      </SectionContainer>
    </main>
  );
}
