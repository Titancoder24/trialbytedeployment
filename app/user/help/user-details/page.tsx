export default function HelpUserDetailsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">User Details</h1>
      <div className="rounded border bg-white p-6">
        <div className="mb-6">
          <div className="font-medium">Eureka Seken</div>
          <div className="text-muted-foreground">eureka88@email.com</div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            Company <span className="font-medium">Sebo INC.</span>
          </div>
          <div>
            Designation{" "}
            <span className="font-medium">Clinical Investigator</span>
          </div>
          <div>
            Contact phone <span className="font-medium">+62 087867654670</span>
          </div>
          <div>
            Country <span className="font-medium">Indonesia</span>
          </div>
          <div>
            Time Zone <span className="font-medium">Jakarta (GMT+7)</span>
          </div>
          <div>
            Plan <span className="font-medium">Trial + Analytics</span>
          </div>
        </div>
      </div>
    </div>
  );
}
