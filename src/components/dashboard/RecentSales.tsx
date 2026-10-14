"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Sale = {
  id: string;
  name: string;
  email: string;
  amount: string;
  date: string;
  status: "completed" | "pending" | "failed";
};

const recentSales: Sale[] = [
  {
    id: "1",
    name: "Olivia Martin",
    email: "olivia.martin@email.com",
    amount: "+$1,999.00",
    date: "Today, 2:30 PM",
    status: "completed",
  },
  {
    id: "2",
    name: "Jackson Lee",
    email: "jackson.lee@email.com",
    amount: "+$39.00",
    date: "Today, 1:15 PM",
    status: "completed",
  },
  {
    id: "3",
    name: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    amount: "+$299.00",
    date: "Yesterday, 5:20 PM",
    status: "completed",
  },
  {
    id: "4",
    name: "William Kim",
    email: "will@email.com",
    amount: "+$99.00",
    date: "Yesterday, 4:45 PM",
    status: "completed",
  },
  {
    id: "5",
    name: "Sofia Davis",
    email: "sofia.davis@email.com",
    amount: "+$39.00",
    date: "Yesterday, 11:30 AM",
    status: "pending",
  },
];

export function RecentSales() {
  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        <CardDescription>You made 265 sales this month.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {recentSales.map((sale) => (
            <div key={sale.id} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={`https://avatar.vercel.sh/${sale.id}.png`} alt={sale.name} />
                <AvatarFallback>
                  {sale.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{sale.name}</p>
                <p className="text-sm text-muted-foreground">{sale.email}</p>
              </div>
              <div className="ml-auto font-medium">
                <div className={`text-sm ${
                  sale.status === "completed" ? "text-green-500" : 
                  sale.status === "pending" ? "text-amber-500" : 
                  "text-red-500"
                }`}>
                  {sale.amount}
                </div>
                <div className="text-xs text-muted-foreground">{sale.date}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
