import { useState } from "react";
import { useLocation } from "wouter";
import { useSoundEffects } from "@/hooks/use-sound";
import { ArrowLeft, ArrowRight, Clock, Bell, CloudSun } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DisplaySettingsData {
  showTimeAndDate: boolean;
  showTime: boolean;
  showDate: boolean;
  showAlerts: boolean;
  showWeather: boolean;
  showWeatherIcon: boolean;
  showConditions: boolean;
  showTemperature: boolean;
}

const DEFAULT_SETTINGS: DisplaySettingsData = {
  showTimeAndDate: true,
  showTime: true,
  showDate: true,
  showAlerts: true,
  showWeather: true,
  showWeatherIcon: true,
  showConditions: true,
  showTemperature: true,
};

const PARAM_MAP: Record<keyof DisplaySettingsData, string> = {
  showTimeAndDate: "time",
  showTime: "t",
  showDate: "d",
  showAlerts: "alerts",
  showWeather: "weather",
  showWeatherIcon: "wi",
  showConditions: "cond",
  showTemperature: "temp",
};

const REVERSE_MAP: Record<string, keyof DisplaySettingsData> = Object.fromEntries(
  Object.entries(PARAM_MAP).map(([k, v]) => [v, k as keyof DisplaySettingsData])
);

export function settingsToParams(settings: DisplaySettingsData): string {
  const parts: string[] = [];
  for (const [key, param] of Object.entries(PARAM_MAP)) {
    const val = settings[key as keyof DisplaySettingsData];
    if (val !== DEFAULT_SETTINGS[key as keyof DisplaySettingsData]) {
      parts.push(`${param}=${val ? "1" : "0"}`);
    }
  }
  return parts.join("&");
}

export function paramsToSettings(search: string): DisplaySettingsData {
  const params = new URLSearchParams(search);
  const settings = { ...DEFAULT_SETTINGS };
  for (const [param, key] of Object.entries(REVERSE_MAP)) {
    const val = params.get(param);
    if (val !== null) {
      settings[key] = val === "1";
    }
  }
  return settings;
}

interface SettingRowProps {
  label: string;
  checked: boolean;
  onCheckedChange: (val: boolean) => void;
  testId: string;
  indent?: boolean;
  disabled?: boolean;
}

function SettingRow({ label, checked, onCheckedChange, testId, indent, disabled }: SettingRowProps) {
  return (
    <div className={cn(
      "flex items-center justify-between gap-4 py-3",
      indent && "pl-8",
      disabled && "opacity-40"
    )}>
      <span className={cn("text-sm sm:text-base text-white", indent && "text-zinc-300")} data-testid={`text-${testId}`}>
        {label}
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        data-testid={`switch-${testId}`}
      />
    </div>
  );
}

export default function DisplaySettings() {
  const [location, navigate] = useLocation();
  const stationIds = location.startsWith("/settings/") ? location.replace("/settings/", "") : "";
  const { playSound } = useSoundEffects();
  const [settings, setSettings] = useState<DisplaySettingsData>(() => paramsToSettings(window.location.search));

  const update = (key: keyof DisplaySettingsData, value: boolean) => {
    playSound("click");
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      if (key === "showTimeAndDate" && !value) {
        next.showTime = false;
        next.showDate = false;
      }
      if (key === "showTimeAndDate" && value) {
        next.showTime = true;
        next.showDate = true;
      }
      if (key === "showWeather" && !value) {
        next.showWeatherIcon = false;
        next.showConditions = false;
        next.showTemperature = false;
      }
      if (key === "showWeather" && value) {
        next.showWeatherIcon = true;
        next.showConditions = true;
        next.showTemperature = true;
      }
      const qs = settingsToParams(next);
      const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
      window.history.replaceState(null, "", newUrl);
      return next;
    });
  };

  const handleContinue = () => {
    playSound("whoosh");
    const qs = settingsToParams(settings);
    navigate(`/departures/${stationIds}${qs ? `?${qs}` : ""}`);
  };

  const handleBack = () => {
    playSound("whoosh");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-background to-background">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2" data-testid="text-settings-title">
            Display Settings
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Choose what to show on the departures screen
          </p>

          <div className="space-y-4">
            <Card className="bg-zinc-900/60 border-white/10 px-5 py-1">
              <div className="flex items-center gap-3 pt-3 pb-1">
                <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Time & Date</span>
              </div>
              <SettingRow
                label="Show Time & Date"
                checked={settings.showTimeAndDate}
                onCheckedChange={(v) => update("showTimeAndDate", v)}
                testId="show-time-date"
              />
              <div className="border-t border-white/5">
                <SettingRow
                  label="Show Time"
                  checked={settings.showTime}
                  onCheckedChange={(v) => update("showTime", v)}
                  testId="show-time"
                  indent
                  disabled={!settings.showTimeAndDate}
                />
              </div>
              <div className="border-t border-white/5">
                <SettingRow
                  label="Show Date"
                  checked={settings.showDate}
                  onCheckedChange={(v) => update("showDate", v)}
                  testId="show-date"
                  indent
                  disabled={!settings.showTimeAndDate}
                />
              </div>
            </Card>

            <Card className="bg-zinc-900/60 border-white/10 px-5 py-1">
              <div className="flex items-center gap-3 pt-3 pb-1">
                <Bell className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Service Alerts</span>
              </div>
              <SettingRow
                label="Show Alerts"
                checked={settings.showAlerts}
                onCheckedChange={(v) => update("showAlerts", v)}
                testId="show-alerts"
              />
            </Card>

            <Card className="bg-zinc-900/60 border-white/10 px-5 py-1">
              <div className="flex items-center gap-3 pt-3 pb-1">
                <CloudSun className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Weather</span>
              </div>
              <SettingRow
                label="Show Weather"
                checked={settings.showWeather}
                onCheckedChange={(v) => update("showWeather", v)}
                testId="show-weather"
              />
              <div className="border-t border-white/5">
                <SettingRow
                  label="Show Weather Icon"
                  checked={settings.showWeatherIcon}
                  onCheckedChange={(v) => update("showWeatherIcon", v)}
                  testId="show-weather-icon"
                  indent
                  disabled={!settings.showWeather}
                />
              </div>
              <div className="border-t border-white/5">
                <SettingRow
                  label="Show Conditions"
                  checked={settings.showConditions}
                  onCheckedChange={(v) => update("showConditions", v)}
                  testId="show-conditions"
                  indent
                  disabled={!settings.showWeather}
                />
              </div>
              <div className="border-t border-white/5">
                <SettingRow
                  label="Show Temperature"
                  checked={settings.showTemperature}
                  onCheckedChange={(v) => update("showTemperature", v)}
                  testId="show-temperature"
                  indent
                  disabled={!settings.showWeather}
                />
              </div>
            </Card>
          </div>

          <div className="flex items-center justify-between gap-3 mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-zinc-600 text-zinc-400"
              data-testid="button-settings-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleContinue}
              className="bg-primary text-primary-foreground"
              data-testid="button-settings-continue"
            >
              View Departures
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
