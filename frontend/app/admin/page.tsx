"use client";

import { useState, useEffect } from "react";
import { useAccount, useSignMessage, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ExternalLink
} from "lucide-react";
import { WHITELIST_MANAGER_ADDRESS, WHITELIST_MANAGER_ABI } from "@/lib/contracts";
import { isAdminWallet, generateAuthMessage } from "@/lib/auth";

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

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminDashboard() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string>("");
  const [requests, setRequests] = useState<WhitelistRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Check if user is admin
  useEffect(() => {
    if (address && isConnected) {
      const adminStatus = isAdminWallet(address);
      setIsAdmin(adminStatus);
      if (!adminStatus) {
        toast({
          title: "Access Denied",
          description: "You are not authorized to access this dashboard",
          variant: "destructive",
        });
      }
    } else {
      setIsAdmin(false);
      setAuthenticated(false);
    }
  }, [address, isConnected]);

  // Authenticate admin
  const handleAuthenticate = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const message = generateAuthMessage(address);
      const signature = await signMessageAsync({ message });

      // Create auth token
      const token = `${address.toLowerCase()}:${signature}:${encodeURIComponent(message)}`;
      setAuthToken(token);
      setAuthenticated(true);

      toast({
        title: "Authentication Successful",
        description: "You are now authenticated as admin",
      });

      // Fetch requests after authentication
      await fetchRequests(token);
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to authenticate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch requests
  const fetchRequests = async (token?: string) => {
    const authHeader = token || authToken;
    if (!authHeader) return;

    try {
      setLoading(true);
      const url = filterStatus !== "all"
        ? `/api/whitelist/admin?status=${filterStatus}`
        : `/api/whitelist/admin`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authHeader}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }

      const data = await response.json();
      setRequests(data.requests);
      setStats(data.stats);
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Approve request
  const handleApprove = async (request: WhitelistRequest) => {
    if (!address) return;

    setProcessingId(request.id);
    try {
      // Step 1: Add to whitelist on-chain
      toast({
        title: "Processing",
        description: "Adding wallet to whitelist...",
      });

      const hash = await writeContractAsync({
        address: WHITELIST_MANAGER_ADDRESS,
        abi: WHITELIST_MANAGER_ABI,
        functionName: "addToWhitelist",
        args: [request.wallet_address as `0x${string}`],
        gas: 100000n, // Set reasonable gas limit (100k gas units)
      });

      toast({
        title: "Transaction Submitted",
        description: "Waiting for confirmation...",
      });

      // Step 2: Update database after transaction is confirmed
      // For now, we'll update immediately with the hash
      // In production, you might want to wait for confirmations
      const response = await fetch(`/api/whitelist/admin/${request.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          status: "approved",
          txHash: hash,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update request in database");
      }

      toast({
        title: "Request Approved",
        description: `Wallet ${request.wallet_address} has been whitelisted!`,
      });

      // Refresh requests
      await fetchRequests();
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Reject request
  const handleReject = async (request: WhitelistRequest) => {
    if (!address) return;

    setProcessingId(request.id);
    try {
      const response = await fetch(`/api/whitelist/admin/${request.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          status: "rejected",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject request");
      }

      toast({
        title: "Request Rejected",
        description: "The whitelist request has been rejected",
      });

      // Refresh requests
      await fetchRequests();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-primary bg-primary/10 border-primary/30";
      case "rejected":
        return "text-destructive bg-destructive/10 border-destructive/30";
      default:
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center space-y-6">
          <ShieldAlert className="w-16 h-16 mx-auto text-primary/50" />
          <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Please connect your wallet to access the admin dashboard
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center space-y-6">
          <ShieldAlert className="w-16 h-16 mx-auto text-destructive" />
          <h1 className="text-3xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">
            You are not authorized to access this dashboard
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="space-y-6">
          <div className="text-center">
            <ShieldCheck className="w-16 h-16 mx-auto text-primary/50 mb-4" />
            <h1 className="text-3xl font-bold text-primary">Admin Authentication</h1>
            <p className="text-muted-foreground mt-2">
              Sign a message to verify your admin access
            </p>
          </div>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20 text-center">
            <Button
              onClick={handleAuthenticate}
              variant="glow"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign Message to Authenticate"
              )}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage whitelist requests</p>
          </div>
          <Button
            onClick={() => fetchRequests()}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20">
            <div className="text-sm text-muted-foreground">Total Requests</div>
            <div className="text-2xl font-bold text-primary mt-1">{stats.total}</div>
          </Card>
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-yellow-500/20">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold text-yellow-500 mt-1">{stats.pending}</div>
          </Card>
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20">
            <div className="text-sm text-muted-foreground">Approved</div>
            <div className="text-2xl font-bold text-primary mt-1">{stats.approved}</div>
          </Card>
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-destructive/20">
            <div className="text-sm text-muted-foreground">Rejected</div>
            <div className="text-2xl font-bold text-destructive mt-1">{stats.rejected}</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((status) => (
            <Button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setTimeout(() => fetchRequests(), 0);
              }}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {loading && requests.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <Card className="p-12 bg-card/50 backdrop-blur-sm border-primary/20 text-center">
              <p className="text-muted-foreground">No requests found</p>
            </Card>
          ) : (
            requests.map((request) => (
              <Card
                key={request.id}
                className="p-6 bg-card/50 backdrop-blur-sm border-primary/20"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <div className="font-mono text-sm">{request.wallet_address}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(request.created_at)}
                        </div>
                      </div>
                      <div
                        className={`ml-auto px-3 py-1 rounded border text-xs font-semibold uppercase ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </div>
                    </div>

                    {request.email && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Email:</span> {request.email}
                      </div>
                    )}

                    <div className="text-sm">
                      <span className="text-muted-foreground">Reason:</span> {request.reason}
                    </div>

                    {request.tx_hash && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">TX:</span>{" "}
                        <a
                          href={`https://sepolia.etherscan.io/tx/${request.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {request.tx_hash.slice(0, 10)}...{request.tx_hash.slice(-8)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {request.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(request)}
                        variant="default"
                        size="sm"
                        disabled={processingId !== null}
                      >
                        {processingId === request.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleReject(request)}
                        variant="destructive"
                        size="sm"
                        disabled={processingId !== null}
                      >
                        {processingId === request.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
