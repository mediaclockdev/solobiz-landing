"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Mail, X } from "lucide-react";
import { BusinessCard } from "@/types/businessCard";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  SignatureLayoutSelector,
  SignaturePreview,
  SignatureLayout,
} from "./email-signature";
import { generateSignatureHTML } from "./email-signature/SignatureGenerator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EmailSignatureSectionProps {
  card: BusinessCard;
}

export function EmailSignatureSection({ card }: EmailSignatureSectionProps) {
  const { user } = useAuth();
  const [selectedLayout, setSelectedLayout] =
    useState<SignatureLayout>("text-only");
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  const [gmailDialogOpen, setGmailDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [copyHtml, setCopyHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  const referralCode = user?.referralCode;

  // Update copyHtml whenever layout/card changes
  useEffect(() => {
    let canceled = false;
    setLoading(true);
    generateSignatureHTML(card, selectedLayout, referralCode).then((html) => {
      if (!canceled) {
        setCopyHtml(html);
        setLoading(false);
      }
    });
    return () => {
      canceled = true;
    };
  }, [card, selectedLayout, referralCode]);

  const copyToClipboard = async () => {
    try {
      if (!copyHtml) return;
      setLoading(true);

      if (navigator.clipboard && (navigator.clipboard as any).write) {
        const blobHtml = new Blob([copyHtml], { type: "text/html" });
        const blobText = new Blob(
          [previewRef.current?.innerText ?? "Signature"],
          { type: "text/plain" }
        );

        const item: any = new ClipboardItem({
          "text/html": blobHtml,
          "text/plain": blobText,
        });
        await (navigator.clipboard as any).write([item]);
      } else {
        // Fallback for older browsers
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.left = "-9999px";
        iframe.style.top = "-9999px";
        document.body.appendChild(iframe);
        const idoc =
          iframe.contentDocument || (iframe as any).contentWindow?.document;
        if (!idoc) throw new Error("Cannot access iframe");
        idoc.open();
        idoc.write(copyHtml);
        idoc.close();
        const range = idoc.createRange();
        range.selectNodeContents(idoc.body);
        const sel = iframe.contentWindow?.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        document.execCommand("copy");
        sel?.removeAllRanges();
        document.body.removeChild(iframe);
      }

      setCopied(true);
      showToast("Copied Successfully!", "success");
      setTimeout(() => setCopied(false), 2000);
      setLoading(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to copy signature", "error");
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Email Signature</h3>

          <SignatureLayoutSelector
            selectedLayout={selectedLayout}
            onLayoutChange={setSelectedLayout}
          />
          <SignaturePreview card={card} selectedLayout={selectedLayout} />

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setPreviewDialogOpen(true)}
              className="flex-1"
              variant="outline"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Signature
                </>
              )}
            </Button>

            <AlertDialog
              open={gmailDialogOpen}
              onOpenChange={setGmailDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <Mail className="w-4 h-4 mr-2" /> Gmail Setup
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <AlertDialogHeader>
                  <AlertDialogCancel className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </AlertDialogCancel>
                  <AlertDialogTitle>Gmail Signature Setup</AlertDialogTitle>
                  <AlertDialogDescription>
                    Follow these steps to add your signature to Gmail
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
                      📋 Important: How Gmail Handles HTML
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Gmail accepts HTML signatures, but the best method is to
                      paste the <strong>rendered signature</strong> (not raw
                      HTML code) directly into Gmail&apos;s signature editor.
                      This preserves formatting better.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Step 1: Copy Your Signature HTML
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Click the "Copy Signature" button above to copy your
                      signature code.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Step 2: Render the Signature First
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      1. Copy your signature (from Step 1) and paste it into the
                      signature field in Gmail settings.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Step 3: Open Gmail Settings
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      1. Go to{" "}
                      <a
                        href="https://mail.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Gmail
                      </a>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      2. Click the gear icon ⚙️ in the top right corner
                    </p>
                    <p className="text-sm text-muted-foreground">
                      3. Select "See all settings"
                    </p>
                    <p className="text-sm text-muted-foreground">
                      4. Make sure you&apos;re on the "General" tab
                    </p>
                    <p className="text-sm text-muted-foreground">
                      5. Scroll down to the "Signature" section
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Step 4: Create Your Signature
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      1. Click "+ Create new" to create a new signature
                    </p>
                    <p className="text-sm text-muted-foreground">
                      2. Give your signature a name (e.g., "Professional")
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Step 5: Paste the Rendered Signature
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      1. Click in the signature editor box
                    </p>
                    <p className="text-sm text-muted-foreground">
                      2. Paste the rendered signature you copied (Ctrl+V /
                      Cmd+V)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      3. Your signature with all formatting should appear
                      correctly
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Step 6: Set as Default (Optional)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Below the signature editor, you can set this signature as
                      default for:
                    </p>
                    <p className="text-sm text-muted-foreground">
                      • "For new emails" - Automatically add to new emails
                    </p>
                    <p className="text-sm text-muted-foreground">
                      • "On reply/forward" - Add when replying or forwarding
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Step 7: Save Changes
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Scroll to the bottom of the settings page and click "Save
                      Changes"
                    </p>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg mt-4 border border-yellow-200 dark:border-yellow-800">
                    <h4 className="font-semibold text-sm mb-2 text-yellow-900 dark:text-yellow-100">
                      ⚡ Simpler Alternative Method
                    </h4>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                      If the method above seems complex, try this easier
                      approach:
                    </p>
                    <ol className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-decimal list-inside">
                      <li>Copy the HTML signature using the button above</li>
                      <li>Compose a new email in Gmail</li>
                      <li>
                        Paste the HTML into the email body (it will render
                        automatically)
                      </li>
                      <li>Select all the rendered content and copy it again</li>
                      <li>
                        Go to Gmail Settings → Signature and paste it there
                      </li>
                    </ol>
                  </div>

                  <div className="bg-muted p-4 rounded-lg mt-4">
                    <h4 className="font-semibold text-sm mb-2">
                      💡 Troubleshooting Tips
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>
                        If images don&apos;t appear, make sure they&apos;re
                        hosted online and publicly accessible
                      </li>
                      <li>
                        Gmail may strip some HTML styling for security - this is
                        normal
                      </li>
                      <li>
                        Always test your signature by sending yourself an email
                      </li>
                      <li>
                        For mobile: Gmail app → Menu → Settings → Select account
                        → Signature
                      </li>
                      <li>
                        If formatting looks wrong, try the alternative method
                        above
                      </li>
                    </ul>
                  </div>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <AlertDialog
          open={previewDialogOpen}
          onOpenChange={setPreviewDialogOpen}
        >
          <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Signature Preview</AlertDialogTitle>
              <AlertDialogCancel className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </AlertDialogCancel>
              <AlertDialogDescription>
                This is your final signature. Copy to use inside Gmail.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Table-based HTML preview */}
            <div
              ref={previewRef}
              className="border rounded-md p-4 bg-white mt-4 hidden"
              style={{ overflowX: "auto" }}
              dangerouslySetInnerHTML={{ __html: copyHtml }}
            />

            <SignaturePreview card={card} selectedLayout={selectedLayout} />

            <div className="mt-4 flex justify-end">
              <Button onClick={copyToClipboard} disabled={loading}>
                <Copy className="w-4 h-4 mr-2" />{" "}
                {loading ? "Copying..." : "Copy Signature"}
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
