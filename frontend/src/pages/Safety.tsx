import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Lock, PhoneCall, ArrowLeft, UserCheck, Car, FileText, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Safety = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-20">
      {/* Header Spacer */}
      <div className="pt-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Safety & Privacy
            </h1>
            <p className="text-sm text-muted-foreground">Your well-being is our top priority</p>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary text-primary-foreground p-6 shadow-lg shadow-primary/20">
          <div className="relative z-10">
            <Shield className="h-12 w-12 mb-4 opacity-90" />
            <h2 className="text-xl font-semibold mb-2">Committed to Campus Security</h2>
            <p className="text-primary-foreground/80 leading-relaxed max-w-md">
              We employ strict verification measures, comprehensive data protection, and real-time support to ensure every ride is a safe experience.
            </p>
          </div>
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
            <Lock className="w-64 h-64" />
          </div>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <UserCheck className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Verified Users Only</CardTitle>
              <CardDescription>Strict identity verification</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every user is required to verify their institutional email address. Drivers undergo additional checks, including driving license verification and vehicle documentation.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <Lock className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>Data Privacy</CardTitle>
              <CardDescription>Your information is encrypted</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We never share your exact pickup/drop-off locations with third parties. Your personal phone number is masked during in-app communications.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <Car className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle>Ride Tracking</CardTitle>
              <CardDescription>Live journey monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Share your live location with trusted contacts during active rides. We track route deviations and monitor unexpected stops to ensure a smooth journey.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <PhoneCall className="h-8 w-8 text-red-500 mb-2" />
              <CardTitle>24/7 Support</CardTitle>
              <CardDescription>Always here to help</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  In case of any emergency, directly contact campus security or regional emergency services through our one-tap emergency button.
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" className="w-full gap-2">
                    <PhoneCall className="h-4 w-4" /> Call SOS
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Guidelines (Accordion) */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Safety Guidelines & Policies
          </h3>
          <Accordion type="single" collapsible className="w-full bg-white dark:bg-gray-800 rounded-xl px-4 shadow-sm border border-border/50">
            <AccordionItem value="item-1">
              <AccordionTrigger className="hover:no-underline text-base font-medium">Community Guidelines</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Treat all community members with respect. Any form of harassment, discrimination, or inappropriate behavior will result in immediate account suspension. We foster an inclusive environment for all campus students and faculty.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="hover:no-underline text-base font-medium">Zero Tolerance Policy</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                We maintain a strict zero-tolerance policy against driving under the influence of drugs or alcohol, reckless driving, and any unsafe vehicle conditions. Users found violating these rules are permanently banned from the platform.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="hover:no-underline text-base font-medium">Data Collection & Usage</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                We collect essential data to facilitate rides, including location during the active ride period, device information, and profile details. This data is strictly used for service provision and is never monetized or sold to third-party advertisers.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border-none">
              <AccordionTrigger className="hover:no-underline text-base font-medium">Reporting an Incident</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                If you feel unsafe or experience a terms violation, use the in-app reporting tool immediately. In severe cases, the SOS feature will alert local authorities and campus safety officers with your live location and vehicle details.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Bottom Contact Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-900/50 flex items-start sm:items-center gap-4 flex-col sm:flex-row">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full shrink-0">
            <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Have a specific concern?</h4>
            <p className="text-sm text-blue-700/80 dark:text-blue-300/80 mt-1">Our safety team is available 24/7 to address any privacy or security questions.</p>
          </div>
          <Button variant="outline" className="shrink-0 bg-white dark:bg-gray-800">
            Contact Support
          </Button>
        </div>

      </div>
    </div>
  );
};

export default Safety;
