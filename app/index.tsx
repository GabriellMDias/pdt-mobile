import DatabaseInit from "@/database/database-init";
import { db } from "@/database/database-connection"
import { useState, useEffect } from "react";
import { router } from 'expo-router';

export default function Index() {
  const [isRouterMounted, setIsRouterMounted] = useState(false);

  // Execute DatabaseInit after component is mounted
  useEffect(() => {
    new DatabaseInit();
    console.log("initialize database");
    setIsRouterMounted(true); // Indicate that the component root is mounted
  }, []);

  // Navigate to "/screens/home" after root component is mounted
  useEffect(() => {
    const conProps = db.getFirstSync<ConProps>("SELECT * FROM conprops;", [])
    if(conProps?.lastsync === null && isRouterMounted) {
      router.replace("/config");
    }
    else if (isRouterMounted) {
      router.replace("/home");
    }
  }, [isRouterMounted]);
  
  return null; // Don't renderize anything
}
