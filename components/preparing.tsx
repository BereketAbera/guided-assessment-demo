"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { JobView } from "@/lib/assessment/job";
import { cn } from "@/lib/utils";

/**
 * The waiting screen. It holds no state of its own: every two seconds it asks
 * the server which stage the job has reached, so refreshing, closing the tab
 * or opening the code on another device shows the same thing.
 */
export function Preparing({ initial }: { initial: JobView }) {
  const router = useRouter();
  const [job, setJob] = useState(initial);
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    let stop = false;
    async function check() {
      try {
        const response = await fetch("/api/job", { cache: "no-store" });
        if (stop) return;
        if (response.status === 401) {
          router.replace("/code");
          return;
        }
        if (!response.ok) throw new Error("not ok");
        const data = (await response.json()) as { status: string; job: JobView };
        setStalled(false);
        setJob(data.job);
        if (data.job.done) {
          stop = true;
          router.replace("/report");
        }
      } catch {
        if (!stop) setStalled(true);
      }
    }
    const timer = window.setInterval(check, 2000);
    void check();
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [router]);

  const active = job.stages[Math.min(job.stageIndex, job.stages.length - 1)];

  return (
    <div>
      <ol className="mt-8 space-y-0">
        {job.stages.map((stage, i) => (
          <li key={stage.id} className="grid grid-cols-[2.25rem_1fr] gap-x-3" data-state={stage.state}>
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold",
                  stage.state === "done" && "border-pine bg-pine text-white",
                  stage.state === "active" && "border-pine bg-paper text-pine",
                  stage.state === "waiting" && "border-rule bg-paper text-stone",
                )}
              >
                {stage.state === "done" ? (
                  <Check aria-hidden className="size-5" />
                ) : stage.state === "active" ? (
                  <span aria-hidden className="breathe size-2.5 rounded-full bg-pine" />
                ) : (
                  <span aria-hidden>{i + 1}</span>
                )}
              </span>
              {i < job.stages.length - 1 ? (
                <span aria-hidden className={cn("my-1 w-0.5 flex-1", stage.state === "done" ? "bg-pine" : "bg-rule")} />
              ) : null}
            </div>
            <div className="pb-7">
              <p className={cn("pt-1 font-semibold", stage.state === "waiting" && "text-stone")}>
                {stage.label}
                <span className="sr-only">
                  {stage.state === "done" ? " (done)" : stage.state === "active" ? " (in progress)" : " (waiting)"}
                </span>
              </p>
              <p className="mt-0.5 text-sm text-stone">{stage.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <p role="status" aria-live="polite" className="rounded-lg bg-sand p-4 text-[0.95rem]" data-testid="job-status">
        {job.done ? (
          <span className="font-semibold">Your report is ready. Opening it now.</span>
        ) : (
          <>
            <span className="font-semibold">{active?.label}.</span> About {job.secondsLeft} second
            {job.secondsLeft === 1 ? "" : "s"} left.
          </>
        )}
      </p>
      {stalled ? (
        <p role="alert" className="mt-3 rounded-lg border border-clay bg-white p-3.5 text-sm">
          We can&apos;t reach the server right now. Your report is still being prepared; this page will catch up when
          your connection returns.
        </p>
      ) : null}
    </div>
  );
}
