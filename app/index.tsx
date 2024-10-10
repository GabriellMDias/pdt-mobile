import DatabaseInit from "@/database/database-init";
import { useState, useEffect } from "react";
import { router } from 'expo-router';
import { getConProps } from "@/utils/getConProps";

export default function Index() {
  const [isRouterMounted, setIsRouterMounted] = useState(false);

  // Execute DatabaseInit after component is mounted
  useEffect(() => {
    new DatabaseInit();
    setIsRouterMounted(true); // Indicate that the component root is mounted
  }, []);

  // Navigate to "/screens/home" after root component is mounted
  useEffect(() => {
    const conProps = getConProps()
    if(conProps?.lastsync === "" && isRouterMounted) {
      router.replace("/config");
    }
    else if (isRouterMounted) {
      router.replace("/home");
    }
  }, [isRouterMounted]);
  
  return null; // Don't renderize anything
}
