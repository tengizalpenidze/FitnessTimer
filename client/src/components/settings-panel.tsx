import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SettingsPanelProps {
  isOpen: boolean;
  settings: {
    workoutTime: number;
    restTime: number;
    roundsPerSet: number;
    numberOfSets: number;
    setRestTime: number;
    audioEnabled: boolean;
  };
  onClose: () => void;
  onSave: (settings: any) => void;
}

export default function SettingsPanel({ isOpen, settings, onClose, onSave }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="absolute bottom-0 left-0 right-0 bg-gray-800 rounded-t-2xl p-6 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Timer Settings</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Workout Time */}
          <div>
            <Label className="block text-sm font-medium mb-2">
              Workout Time: {localSettings.workoutTime}s
            </Label>
            <Slider
              value={[localSettings.workoutTime]}
              onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, workoutTime: value }))}
              min={10}
              max={120}
              step={5}
              className="w-full"
            />
          </div>

          {/* Rest Time */}
          <div>
            <Label className="block text-sm font-medium mb-2">
              Rest Time: {localSettings.restTime}s
            </Label>
            <Slider
              value={[localSettings.restTime]}
              onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, restTime: value }))}
              min={5}
              max={60}
              step={5}
              className="w-full"
            />
          </div>

          {/* Rounds per Set */}
          <div>
            <Label className="block text-sm font-medium mb-2">
              Rounds per Set: {localSettings.roundsPerSet}
            </Label>
            <Slider
              value={[localSettings.roundsPerSet]}
              onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, roundsPerSet: value }))}
              min={3}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          {/* Number of Sets */}
          <div>
            <Label className="block text-sm font-medium mb-2">
              Number of Sets: {localSettings.numberOfSets}
            </Label>
            <Slider
              value={[localSettings.numberOfSets]}
              onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, numberOfSets: value }))}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          {/* Set Rest Time */}
          <div>
            <Label className="block text-sm font-medium mb-2">
              Set Rest Time: {localSettings.setRestTime}s
            </Label>
            <Slider
              value={[localSettings.setRestTime]}
              onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, setRestTime: value }))}
              min={30}
              max={300}
              step={15}
              className="w-full"
            />
          </div>

          {/* Audio Settings */}
          <div className="flex items-center space-x-3">
            <Switch
              checked={localSettings.audioEnabled}
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, audioEnabled: checked }))}
            />
            <Label className="text-lg">Enable Audio Cues</Label>
          </div>
        </div>

        <Button
          onClick={handleSave}
          className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg mt-6 transition-all ripple"
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
}
