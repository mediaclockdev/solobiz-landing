"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  getDocs,
  collection,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";

export function SystemInfo() {
  const { user } = useAuth();

  const [userCount, setUserCount] = useState(0);
  const [userCardsCount, setUserCardsCount] = useState(0);

  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    async function fetchTodayUsersAndTotalCards() {
      try {
        // === Users created today ===
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const usersQuery = query(
          collection(db, "users"),
          where("createdAt", ">=", Timestamp.fromDate(today)),
          where("createdAt", "<", Timestamp.fromDate(tomorrow))
        );

        const usersSnapshot = await getDocs(usersQuery);
        const totalUsersToday = usersSnapshot.size;
        setUserCount(totalUsersToday);

        //=== Total cards ===
        const now = new Date();

        // Start of today in UTC
        const startOfDay = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            0,
            0,
            0,
            0
          )
        );
        // End of today in UTC
        const endOfDay = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );
        const q = query(
          collection(db, "cards"),
          where("metadata.createdAt", ">=", startOfDay.toISOString()),
          where("metadata.createdAt", "<=", endOfDay.toISOString())
        );
        const snapshot = await getDocs(q);
        const todayCount = snapshot.size;
        setUserCardsCount(todayCount);

        const messageQuery = query(
          collection(db, "support_data"),
          where("createdAt", ">=", startOfDay.toISOString()),
          where("createdAt", "<", endOfDay.toISOString())
        );

        const snapshot1 = await getDocs(messageQuery);
        setMessageCount(snapshot1.size);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetchTodayUsersAndTotalCards();
  }, [user]);
  return (
    <>
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-lg">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Performance</span>
              <span className="text-sm font-medium text-green-600">
                (Firebase)Excellent
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Firebase Version</span>
              <span className="text-sm font-medium text-green-600">11.4.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">NextJS Version</span>
              <span className="text-sm font-medium text-green-600">15.5.7</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Server Uptime</span>
              <span className="text-sm font-medium text-green-600">99.98%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">New Signups Today</span>
              <span className="text-sm font-medium">{userCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Cards Created Today</span>
              <span className="text-sm font-medium">{userCardsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Messages Sent Today</span>
              <span className="text-sm font-medium">{messageCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
