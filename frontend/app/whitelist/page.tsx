"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, XCircle, Loader2, ShieldCheck } from "lucide-react";

interface WhitelistRequest {
  id: number;
  wallet_address: string;
  email?: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  tx_hash?: string;
  created_at: number;
  updated_at: number;
  reviewed_by?: string;
  reviewed_at?: number;
}

export default function WhitelistPage() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [existingRequest, setExistingRequest] = useState<WhitelistRequest | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    reason: "",
  });

  // Check if user already has a request
  useEffect(() => {
    if (address && isConnected) {
      checkExistingRequest();
    } else {
      setExistingRequest(null);
    }
  }, [address, isConnected]);

  const checkExistingRequest = async () => {
    if (!address) return;

    setCheckingStatus(true);
    try {
      const response = await fetch(`/api/whitelist/request?wallet=${address}`);
      const data = await response.json();

      if (data.exists && data.request) {
        setExistingRequest(data.request);
      } else {
        setExistingRequest(null);
      }
    } catch (error) {
      console.error("Error checking request status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address || !isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to submit a request",
        variant: "destructive",
      });
      return;
    }

    if (formData.reason.trim().length < 10) {
      toast({
        title: "Invalid Reason",
        description: "Please provide a reason of at least 10 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/whitelist/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address,
          email: formData.email || undefined,
          reason: formData.reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      toast({
        title: "Request Submitted",
        description: "Your whitelist request has been submitted successfully",
      });

      setExistingRequest(data.request);
      setFormData({ email: "", reason: "" });
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit whitelist request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-5 h-5 text-primary" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-destructive" />;
      case "pending":
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-primary border-primary/30 bg-primary/5";
      case "rejected":
        return "text-destructive border-destructive/30 bg-destructive/5";
      case "pending":
      default:
        return "text-yellow-500 border-yellow-500/30 bg-yellow-500/5";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center space-y-6">
          <ShieldCheck className="w-16 h-16 mx-auto text-primary/50" />
          <h1 className="text-3xl font-bold text-primary">Whitelist Request</h1>
          <p className="text-muted-foreground">
            Please connect your wallet to submit a whitelist request
          </p>
        </div>
      </div>
    );
  }

  if (checkingStatus) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Checking request status...</p>
        </div>
      </div>
    );
  }

  if (existingRequest) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="space-y-6">
          <div className="text-center">
            <ShieldCheck className="w-16 h-16 mx-auto text-primary/50 mb-4" />
            <h1 className="text-3xl font-bold text-primary">Whitelist Request Status</h1>
          </div>

          <Card className="p-6 space-y-6 bg-card/50 backdrop-blur-sm border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(existingRequest.status)}
                <div>
                  <h2 className="text-lg font-semibold uppercase">
                    {existingRequest.status}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Submitted: {formatDate(existingRequest.created_at)}
                  </p>
                </div>
              </div>
              <div
                className={`px-4 py-2 rounded border text-xs font-semibold uppercase ${getStatusColor(
                  existingRequest.status
                )}`}
              >
                {existingRequest.status}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <label className="text-sm text-muted-foreground">Wallet Address</label>
                <p className="font-mono text-sm break-all">{existingRequest.wallet_address}</p>
              </div>

              {existingRequest.email && (
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="text-sm">{existingRequest.email}</p>
                </div>
              )}

              <div>
                <label className="text-sm text-muted-foreground">Reason</label>
                <p className="text-sm">{existingRequest.reason}</p>
              </div>

              {existingRequest.status === "approved" && existingRequest.tx_hash && (
                <div>
                  <label className="text-sm text-muted-foreground">Transaction Hash</label>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${existingRequest.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-primary hover:underline break-all"
                  >
                    {existingRequest.tx_hash}
                  </a>
                </div>
              )}

              {existingRequest.reviewed_at && (
                <div>
                  <label className="text-sm text-muted-foreground">
                    {existingRequest.status === "approved" ? "Approved" : "Rejected"} At
                  </label>
                  <p className="text-sm">{formatDate(existingRequest.reviewed_at)}</p>
                </div>
              )}
            </div>

            {existingRequest.status === "pending" && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Your request is under review. You will be notified once a decision is made.
                </p>
              </div>
            )}

            {existingRequest.status === "approved" && (
              <div className="pt-4 border-t border-border bg-primary/5 -mx-6 -mb-6 px-6 py-4 rounded-b">
                <p className="text-sm text-center text-primary font-semibold">
                  ✓ Your wallet has been whitelisted! You now have access to all DEX features.
                </p>
              </div>
            )}

            {existingRequest.status === "rejected" && (
              <div className="pt-4 border-t border-border bg-destructive/5 -mx-6 -mb-6 px-6 py-4 rounded-b">
                <p className="text-sm text-center text-destructive">
                  Your request has been rejected. Please contact support for more information.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 mx-auto text-primary/50 mb-4" />
          <h1 className="text-3xl font-bold text-primary">Request Whitelist Access</h1>
          <p className="text-muted-foreground mt-2">
            Submit your request to gain access to the Private DEX
          </p>
        </div>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Wallet Address <span className="text-muted-foreground">(Connected)</span>
              </label>
              <Input
                value={address}
                disabled
                className="font-mono text-sm bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email <span className="text-muted-foreground">(Optional)</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                Provide an email if you want to be notified about your request status
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium text-foreground">
                Reason for Access <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="reason"
                placeholder="Please explain why you would like access to the Private DEX..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="min-h-[120px] bg-background/50 resize-none"
                maxLength={500}
                required
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.reason.length}/500 characters (min. 10)
              </p>
            </div>

            <Button
              type="submit"
              variant="glow"
              size="lg"
              className="w-full"
              disabled={loading || formData.reason.trim().length < 10}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </form>
        </Card>

        <Card className="p-4 bg-primary/5 border-primary/20">
          <h3 className="text-sm font-semibold text-primary mb-2">What Happens Next?</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Your request will be reviewed by the admin team</li>
            <li>• You will receive a notification once your request is processed</li>
            <li>• If approved, your wallet will be automatically whitelisted</li>
            <li>• You can then access all DEX features including swaps and liquidity provision</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
