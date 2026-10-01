import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "./utils";
import { Button, buttonVariants } from "./button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Partial<Pick<React.ComponentProps<typeof Button>, "size">> &
  React.ComponentProps<"button">;

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <button type="button"
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "default" : "ghost",
          size,
        }),
        isActive &&
          "bg-primary text-white hover:bg-primary/90 dark:bg-secondary dark:hover:bg-secondary/90",
        !isActive && "hover:bg-gray-100 dark:hover:bg-gray-800",
        "min-w-[40px] h-10",
        className,
      )}
      {...props}
    />
  );
}

type PaginationCurrentProps = Partial<
  Pick<React.ComponentProps<typeof Button>, "size">
> &
  React.ComponentProps<"span">;

function PaginationCurrent({
  className,
  size = "icon",
  ...props
}: PaginationCurrentProps) {
  return (
    <span
      aria-current="page"
      data-slot="pagination-current"
      className={cn(
        buttonVariants({ variant: "default", size }),
        "h-10 min-w-[40px] bg-primary text-white dark:bg-secondary",
        className,
      )}
      {...props}
    />
  );
}

type PaginationDirectionProps = React.ComponentProps<
  typeof PaginationLink
> & {
  disabled?: boolean;
  isRtl?: boolean;
  label?: string;
};

function PaginationPrevious({
  className,
  disabled,
  isRtl = false,
  label = "Previous",
  size,
  "aria-label": ariaLabel,
  ...props
}: PaginationDirectionProps) {
  return (
    <PaginationLink
      aria-label={ariaLabel ?? "Go to previous page"}
      size={size ?? "default"}
      className={cn(
        "gap-1 px-3 sm:px-4",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {isRtl ? (
        <ChevronRightIcon className="w-4 h-4" aria-hidden="true" />
      ) : (
        <ChevronLeftIcon className="w-4 h-4" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{label}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  disabled,
  isRtl = false,
  label = "Next",
  size,
  "aria-label": ariaLabel,
  ...props
}: PaginationDirectionProps) {
  return (
    <PaginationLink
      aria-label={ariaLabel ?? "Go to next page"}
      size={size ?? "default"}
      className={cn(
        "gap-1 px-3 sm:px-4",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      <span className="hidden sm:inline">{label}</span>
      {isRtl ? (
        <ChevronLeftIcon className="w-4 h-4" aria-hidden="true" />
      ) : (
        <ChevronRightIcon className="w-4 h-4" aria-hidden="true" />
      )}
    </PaginationLink>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationCurrent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
};
