"use client";
import React, { useEffect, useState, useRef } from "react";
import { IconButton, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { CheckCircle, Error, Info, Warning } from "@mui/icons-material";

export type ToastProps = {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  link?: string;
  btnText?: string;
  duration?: number;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  onClose?: () => void;
};

const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  link,
  btnText = "View",
  duration = 3000,
  position = "top-right",
  onClose,
}) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const [remainingTime, setRemainingTime] = useState(duration);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!paused) {
      const startTime = Date.now();

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newRemainingTime = Math.max(remainingTime - elapsed, 0);
        setRemainingTime(newRemainingTime);
        setProgress((newRemainingTime / duration) * 100);

        if (newRemainingTime === 0 && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }, 100);

      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, remainingTime);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [paused, remainingTime, duration, onClose]);

  const handleMouseEnter = () => {
    setPaused(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleMouseLeave = () => {
    setPaused(false);
  };

  const handleClose = () => {
    setVisible(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (onClose) onClose();
  };

  const iconStyles = "mr-2 text-white";
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className={iconStyles} />;
      case "error":
        return <Error className={iconStyles} />;
      case "warning":
        return <Warning className={iconStyles} />;
      case "info":
      default:
        return <Info className={iconStyles} />;
    }
  };

  const getColor = () => {
    switch (type) {
      case "success":
        return "bg-green-700";
      case "error":
        return "bg-red-700";
      case "warning":
        return "bg-yellow-600";
      case "info":
      default:
        return "bg-blue-500";
    }
  };

  const getPos = () => {
    switch (position) {
      case "top-left":
        return "top-4 left-4";
      case "top-center":
        return "top-4 left-1/2 transform -translate-x-1/2";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-center":
        return "bottom-4 left-1/2 transform -translate-x-1/2";
      case "bottom-right":
      default:
        return "bottom-4 right-4";
    }
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed max-w-md text-white p-4 rounded-lg shadow-xl flex items-stretch transition-transform transform ${
        visible ? "scale-100" : "scale-0"
      } duration-300 ease-in-out overflow-hidden ${getColor()} ${getPos()}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ zIndex: 9999 }}
    >
      {getIcon()}
      <div className="flex flex-col items-end gap-2">
        <span className="flex-1">{message}</span>

        {link && (
          <Button
            variant="outlined"
            size="small"
            color="inherit"
            href={link}
            target="_blank"
            sx={{
              borderColor: "white",
              color: "white",
            }}
          >
            {btnText}
          </Button>
        )}
      </div>

      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
        sx={{ ml: 4 }}
      >
        <CloseIcon
          fontSize="medium"
          className="bg-white/25 rounded-full p-1 hover:bg-white/30 transition-all"
        />
      </IconButton>
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-opacity-40"
        style={{ background: "rgba(0,0,0,0.3)" }}
      >
        <div
          className="h-full bg-white transition-all ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default Toast;
