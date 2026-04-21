"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface KeyValuePair {
  key: string;
  value: string;
}

interface KeyValueBuilderProps {
  label?: string;
  onChange?: (value: Record<string, string>) => void;
  initialValue?: Record<string, string>;
}

export function KeyValueBuilder({
  label = "Key-Value Pairs",
  onChange,
  initialValue = {},
}: KeyValueBuilderProps) {
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => {
    if (Object.keys(initialValue).length === 0) {
      return [{ key: "", value: "" }];
    }
    return Object.entries(initialValue).map(([key, value]) => ({ key, value }));
  });

  const [error, setError] = useState("");

  const handleKeyChange = (index: number, newKey: string) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], key: newKey };
    setPairs(newPairs);

    const hasDuplicate = newPairs.some(
      (p, i) => p.key !== "" && newPairs.some((other, j) => i !== j && other.key === p.key)
    );
    setError(hasDuplicate ? "Duplicate keys are not allowed" : "");

    emitChange(newPairs);
  };

  const handleValueChange = (index: number, newValue: string) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], value: newValue };
    setPairs(newPairs);
    emitChange(newPairs);
  };

  const addPair = () => {
    setPairs([...pairs, { key: "", value: "" }]);
  };

  const removePair = (index: number) => {
    if (pairs.length === 1) {
      setPairs([{ key: "", value: "" }]);
    } else {
      setPairs(pairs.filter((_, i) => i !== index));
    }

    const newPairs = pairs.length === 1
      ? [{ key: "", value: "" }]
      : pairs.filter((_, i) => i !== index);
    emitChange(newPairs);
  };

  const emitChange = (newPairs: KeyValuePair[]) => {
    const obj: Record<string, string> = {};
    newPairs.forEach((p) => {
      if (p.key.trim()) {
        obj[p.key.trim()] = p.value;
      }
    });
    onChange?.(obj);
  };

  const isValid = !error && pairs.every((p) => p.key.trim() !== "");

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {pairs.map((pair, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input
              placeholder="Key"
              value={pair.key}
              onChange={(e) => handleKeyChange(index, e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Value"
              value={pair.value}
              onChange={(e) => handleValueChange(index, e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removePair(index)}
              disabled={pairs.length === 1 && index === 0}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="button" variant="outline" size="sm" onClick={addPair}>
        + Add Field
      </Button>
    </div>
  );
}