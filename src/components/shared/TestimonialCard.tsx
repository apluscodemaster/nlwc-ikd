"use client";

import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TestimonialCardProps {
  name: string;
  role: string;
  content: string;
  image?: string;
  index?: number;
}

export default function TestimonialCard({
  name,
  role,
  content,
  image,
  index = 0,
}: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="h-full border-none shadow-lg shadow-gray-100 hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-8 flex flex-col h-full">
          <div className="mb-6">
            <Quote className="w-10 h-10 text-primary/20" />
          </div>

          <p className="text-lg text-gray-700 italic flex-grow mb-8">
            "{content}"
          </p>

          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 border-2 border-primary/10">
              <AvatarImage src={image} alt={name} />
              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-bold text-gray-900">{name}</h4>
              <p className="text-sm text-muted-foreground">{role}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
