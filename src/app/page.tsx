"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Heart, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative w-full h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden">
          {/* Background Image - Placeholder for now */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center text-white">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Welcome to{" "}
              <span className="text-primary">The New & Living Way Church</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto">
              A community of faith, hope, and love in Ikorodu. Join us as we
              grow together in Christ.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="text-lg px-8 h-14 rounded-full shadow-xl"
              >
                <Link href="/about">
                  Our Story <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="text-lg px-8 h-14 rounded-full shadow-xl"
              >
                <Link href="/live">Watch Live</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Welcome Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image Placeholder */}
            <div className="relative h-[400px] rounded-3xl overflow-hidden bg-gray-200">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <Users className="w-24 h-24" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Welcome Home
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                At The New & Living Way Church, we believe in creating a space
                where everyone can encounter God&apos;s love, grow in faith, and
                serve others with purpose.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Whether you&apos;re exploring faith for the first time or have
                been walking with Christ for years, you&apos;ll find a welcoming
                community here.
              </p>
              <Button asChild variant="outline" size="lg" className="mt-4">
                <Link href="/about">
                  Learn More About Us <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Service Times */}
        <section className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Join Us This Sunday
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Experience worship, fellowship, and powerful teaching every week
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Sunday Service */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Sunday Service</h3>
                <p className="text-muted-foreground mb-4">
                  Join us for worship and the Word
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">Sunday • 8:00 AM</p>
                  <p className="text-muted-foreground">Main Sanctuary</p>
                </div>
              </div>

              {/* Bible Study */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Bible Study</h3>
                <p className="text-muted-foreground mb-4">
                  Grow deeper in God&apos;s Word
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">Wednesday • 6:00 PM</p>
                  <p className="text-muted-foreground">Church Auditorium</p>
                </div>
              </div>

              {/* Prayer Meeting */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Prayer Meeting</h3>
                <p className="text-muted-foreground mb-4">
                  Intercede together in faith
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">Friday • 5:00 PM</p>
                  <p className="text-muted-foreground">Prayer Room</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Preview */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Joyful Moments
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Relive the beautiful memories from our services and events
            </p>
          </div>

          {/* Placeholder for gallery preview grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="aspect-square bg-gray-200 rounded-xl overflow-hidden hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Heart className="w-12 h-12" />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/gallery">
                View Full Gallery <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-primary/90 to-primary py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Take the Next Step?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              We&apos;d love to connect with you and help you find your place in
              our church family
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="text-lg px-8 h-14 rounded-full"
              >
                <Link href="/contact">Get in Touch</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-lg px-8 h-14 rounded-full bg-white/10 border-white text-white hover:bg-white hover:text-primary"
              >
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
