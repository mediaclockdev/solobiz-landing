"use client";
const stats = [
  { name: 'Digital Cards Created', value: '10,000+' },
  { name: 'Professional Users', value: '5,000+' },
  { name: 'Countries Worldwide', value: '50+' },
  { name: 'Average Time to Create', value: '3 min' },
];

export function StatsSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Powering professional connections globally
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Join a growing community of professionals who've made the switch to digital.
          </p>
        </div>
        
        <dl className="mx-auto mt-16 grid grid-cols-1 gap-x-8 gap-y-12 text-center sm:mt-20 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.name} className="flex flex-col gap-y-3">
              <dt className="text-base leading-7 text-muted-foreground">{stat.name}</dt>
              <dd className="order-first text-3xl font-bold tracking-tight text-primary sm:text-5xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}