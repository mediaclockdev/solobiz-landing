"use client";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  DollarSign,
  Trophy,
  TrendingUp,
  Award,
  Crown,
  Calculator,
  FileText
} from "lucide-react";

const Opportunities = () => {
  return (
    <Layout>
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-3 text-solo-blue">
            Earnings Opportunities
          </h1>
          <p className="text-xl text-center text-solo-gray-dark mb-12 max-w-3xl mx-auto">
            Choose your track and start earning passive income with SoloBizCards
          </p>

          {/* Passive Income Card */}
          {/* <Card className="mb-12 overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-solo-blue to-solo-blue-light p-8 text-white">
              <div className="flex items-center gap-4">
                <DollarSign size={48} strokeWidth={1.5} className="flex-shrink-0" />
                <div>
                  <h2 className="text-3xl font-bold">Earn Passive Income</h2>
                  <p className="text-xl opacity-90 mt-2">
                    The only business card where you can earn monthly recurring revenue <span className="text-sm font-normal">MRR</span> while you share your card.
                  </p>
                </div>
              </div>
            </div>
          </Card> */}

          {/* Passive Income, Income Calculator, and Flyer Generator Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-12">
            {/* Passive Income Card */}
            <Card className="lg:col-span-2 overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-solo-blue to-solo-blue-light p-8 text-white">
                <DollarSign size={48} strokeWidth={1.5} className="mb-4" />
                <h2 className="text-3xl font-bold mb-2">Earn Passive Income</h2>
                <p className="text-xl opacity-90">
                  The only business card where you can earn monthly recurring
                  revenue <span className="text-sm font-normal">MRR</span> while
                  you share your card.
                </p>
              </div>
            </Card>

            {/* Income Calculator Card */}
            <Card
              className="group overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1 active:scale-95 active:shadow-md"
              onClick={() =>
                window.open("https://passive-income-calcs.vercel.app", "_blank")
              }
            >
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 p-6 text-white h-full flex flex-col items-center justify-center text-center">
                <Calculator
                  size={48}
                  strokeWidth={1.5}
                  className="mb-4 transition-transform duration-300 group-hover:rotate-12"
                />
                <h2 className="text-2xl font-bold mb-2">Income Calculator</h2>
                <p className="text-base opacity-90 whitespace-nowrap">
                  See what you could earn
                </p>
              </div>
            </Card>

            {/* Flyer Generator Card */}
            <Card
              className="group overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1 active:scale-95 active:shadow-md"
              onClick={() =>
                window.open("https://solobizcards.com/lead-gen", "_blank")
              }
            >
              <div className="bg-gradient-to-r from-purple-500 to-purple-400 p-6 text-white h-full flex flex-col items-center justify-center text-center">
                <FileText
                  size={48}
                  strokeWidth={1.5}
                  className="mb-4 transition-transform duration-300 group-hover:rotate-12"
                />
                <h2 className="text-2xl font-bold mb-2 leading-tight">
                  Leads
                  <br />
                  Generator
                </h2>
                <p className="text-base opacity-90 whitespace-nowrap">
                  Grow your CRM
                </p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {/* Bronze Track */}
            <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-amber-700 to-amber-500 text-white p-6">
                <div className="flex justify-between items-center">
                  <Badge className="bg-white text-amber-700 hover:bg-white/90">
                    Bronze Track
                  </Badge>
                  <Trophy className="h-8 w-8" />
                </div>
                <CardTitle className="text-3xl font-bold mt-4 flex items-end">
                  $1,500 <span className="text-sm ml-1">MRR</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-amber-100 text-amber-700 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <TrendingUp className="h-3 w-3" />
                    </span>
                    <span>Give away 150 cards minimum</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-amber-100 text-amber-700 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <TrendingUp className="h-3 w-3" />
                    </span>
                    <span>
                      At least 100 of your recruits give-away at least 100 cards
                    </span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="bg-amber-50 p-4 border-t border-amber-100">
                <div className="flex items-center gap-2 text-amber-700 font-semibold">
                  <Award className="h-5 w-5" />
                  <span>10,000 Grandchildren</span>
                </div>
              </CardFooter>
            </Card>

            {/* Silver Track */}
            <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-gray-500 to-gray-300 text-white p-6">
                <div className="flex justify-between items-center">
                  <Badge className="bg-white text-gray-600 hover:bg-white/90">
                    Silver Track
                  </Badge>
                  <Trophy className="h-8 w-8" />
                </div>
                <CardTitle className="text-3xl font-bold mt-4 flex items-end">
                  $3,500 <span className="text-sm ml-1">MRR</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-gray-100 text-gray-600 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <TrendingUp className="h-3 w-3" />
                    </span>
                    <span>Give away 250 cards minimum</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-gray-100 text-gray-600 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <TrendingUp className="h-3 w-3" />
                    </span>
                    <span>
                      At least 200 of your recruits give-away at least 100 cards
                    </span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="bg-gray-50 p-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-gray-600 font-semibold">
                  <Award className="h-5 w-5" />
                  <span>20,000 Grandchildren</span>
                </div>
              </CardFooter>
            </Card>

            {/* Gold Track */}
            <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-yellow-500 to-yellow-300 text-white p-6">
                <div className="flex justify-between items-center">
                  <Badge className="bg-white text-yellow-600 hover:bg-white/90">
                    Gold Track
                  </Badge>
                  <Trophy className="h-8 w-8" />
                </div>
                <CardTitle className="text-3xl font-bold mt-4 flex items-end">
                  $5,500 <span className="text-sm ml-1">MRR</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-yellow-100 text-yellow-600 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <TrendingUp className="h-3 w-3" />
                    </span>
                    <span>Give away 500 cards minimum</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-yellow-100 text-yellow-600 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <TrendingUp className="h-3 w-3" />
                    </span>
                    <span>
                      At least 300 of your recruits give-away at least 100 cards
                    </span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="bg-yellow-50 p-4 border-t border-yellow-100">
                <div className="flex items-center gap-2 text-yellow-600 font-semibold">
                  <Award className="h-5 w-5" />
                  <span>30,000 Grandchildren</span>
                </div>
              </CardFooter>
            </Card>

            {/* Platinum Track */}
            <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-6">
                <div className="flex justify-between items-center">
                  <Badge className="bg-white text-blue-600 hover:bg-white/90">
                    Platinum Track
                  </Badge>
                  <Crown className="h-8 w-8" />
                </div>
                <CardTitle className="text-3xl font-bold mt-4 flex items-end">
                  $10,000 <span className="text-sm ml-1">MRR</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-600 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <TrendingUp className="h-3 w-3" />
                    </span>
                    <span>Give away 750 cards minimum</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-600 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <TrendingUp className="h-3 w-3" />
                    </span>
                    <span>
                      At least 550 of your recruits give-away at least 100 cards
                    </span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="bg-blue-50 p-4 border-t border-blue-100">
                <div className="flex items-center gap-2 text-blue-600 font-semibold">
                  <Award className="h-5 w-5" />
                  <span>55,000 Grandchildren</span>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Added Residual Information Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-12 border border-gray-100">
            <h3 className="text-xl font-bold text-solo-blue-dark mb-2">
              How do I earn residuals?
            </h3>
            <p className="text-gray-700">
              You'll earn 10% of every subscription from businesses YOU recruit
              and up to 50% of every subscription from businesses YOUR recruits,
              recruit. Limited time offer, subject to change.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Opportunities;
