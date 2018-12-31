import * as Rx from "rxjs";

const subject = new Rx.BehaviorSubject();

// subscriber 1
subject.subscribe((data) => {
    console.log('Subscriber A:', data);
});

subject.next(Math.random());
subject.next(Math.random());

// subscriber 2
subject.subscribe((data) => {
    console.log('Subscriber B:', data);
});

subject.next(Math.random());

console.log(subject.value)