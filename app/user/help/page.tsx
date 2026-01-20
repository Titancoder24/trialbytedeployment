"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  ChevronDown,
  Users,
  User,
  Settings,
  MessageSquare,
  FileText,
  Lightbulb,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SuggestionModal } from "@/components/suggestion-modal";

export default function HelpCenterPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const router = useRouter();

  const categories = [
    { name: "Getting Started", active: true },
    { name: "Account", active: false },
    { name: "Billing", active: false },
    { name: "Frequently Asked Questions", active: false },
    { name: "Features", active: false },
  ];

  const helpTopics = [
    {
      icon: Users,
      title: "Memberships",
      description:
        "Access exclusive clinical trials and updates with a registered membership.",
      link: "Learn more",
      onClick: () => router.push("/user/help/memberships"),
    },
    {
      icon: User,
      title: "User Details",
      description:
        "Securely view and update personal and health-related trial data.",
      link: "Learn more",
      onClick: () => router.push("/user/help/user-details"),
    },
    {
      icon: Settings,
      title: "Usage Metrics",
      description:
        "Track your engagement with trial activities and platform features.",
      link: "Learn more",
      onClick: () => router.push("/user/help/usage-metrics"),
    },
    {
      icon: MessageSquare,
      title: "Raise a complaint",
      description:
        "Experienced an issue during your trial experience? We're here to help.",
      link: "Learn more",
      onClick: () => {},
    },
    {
      icon: FileText,
      title: "Product Manuals",
      description:
        "Browse detailed guides related to trial devices, procedures, or medications.",
      link: "Learn more",
      onClick: () => {},
    },
    {
      icon: Lightbulb,
      title: "Write a suggestion",
      description:
        "Your feedback helps us improve our trials and platform experience.",
      link: "Learn more",
      onClick: () => setIsSuggestionModalOpen(true),
    },
  ];

  const faqs = [
    {
      question: "What is this theme layout for?",
      answer:
        "We believe this theme is for everyone who can use Figma on the drag-n-drop basis. As the template is fully build for this purpose. Let hop on your marketing team and collaborate with them!",
    },
    {
      question: "What is this theme layout for?",
      answer:
        "We believe this theme is for everyone who can use Figma on the drag-n-drop basis. As the template is fully build for this purpose. Let hop on your marketing team and collaborate with them!",
    },
    {
      question: "What is this theme layout for?",
      answer:
        "We believe this theme is for everyone who can use Figma on the drag-n-drop basis. As the template is fully build for this purpose. Let hop on your marketing team and collaborate with them!",
    },
    {
      question: "What is this theme layout for?",
      answer:
        "We believe this theme is for everyone who can use Figma on the drag-n-drop basis. As the template is fully build for this purpose. Let hop on your marketing team and collaborate with them!",
    },
    {
      question: "What is this theme layout for?",
      answer:
        "We believe this theme is for everyone who can use Figma on the drag-n-drop basis. As the template is fully build for this purpose. Let hop on your marketing team and collaborate with them!",
    },
    {
      question: "What is this theme layout for?",
      answer:
        "We believe this theme is for everyone who can use Figma on the drag-n-drop basis. As the template is fully build for this purpose. Let hop on your marketing team and collaborate with them!",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            How we can help you?
          </h1>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search the Helpcenter"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={category.active ? "default" : "outline"}
                className={`${
                  category.active
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "text-blue-500 border-blue-500 hover:bg-blue-50"
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Help Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {helpTopics.map((topic, index) => (
            <Card
              key={index}
              className="text-center p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={topic.onClick}
            >
              <CardHeader className="pb-4">
                <div className="w-12 h-12 mx-auto mb-4 text-gray-600">
                  <topic.icon className="w-full h-full" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {topic.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {topic.description}
                </CardDescription>
                <Button
                  variant="link"
                  className="text-blue-500 hover:text-blue-600 p-0"
                >
                  {topic.link}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FAQ Text */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently
              <br />
              Asked Questions
            </h2>
            <p className="text-gray-600 mb-4">
              We are answering most frequent questions. No worries if you not
              find exact one. You can find out more by searching or continuing
              clicking button below or directly{" "}
              <Button
                variant="link"
                className="text-blue-500 hover:text-blue-600 p-0 h-auto"
              >
                contact our support.
              </Button>
            </p>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Collapsible
                key={index}
                open={openFAQ === index}
                onOpenChange={() =>
                  setOpenFAQ(openFAQ === index ? null : index)
                }
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto text-left hover:bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <span className="font-medium text-gray-900">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        openFAQ === index ? "transform rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </div>

      <SuggestionModal
        open={isSuggestionModalOpen}
        onOpenChange={setIsSuggestionModalOpen}
      />
    </div>
  );
}
