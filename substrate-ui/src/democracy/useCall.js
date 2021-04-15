import { useEffect, useRef, useState } from 'react';

// functions from Polkadot apps/useCall.ts

export function useIsMountedRef () {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

export function transformIdentity (value) {
  return value;
}

function isNull (x) {
  return x === null;
}

function isUndefined (x) {
  return x === undefined;
}

// extract the serialized and mapped params, all ready for use in our call
function extractParams (fn, params, { paramMap = transformIdentity } = {}) {
  return [
    JSON.stringify({ f: (fn)?.name, p: params }),
    params.length === 0 || !params.some((param) => isNull(param) || isUndefined(param))
      ? paramMap(params)
      : null
  ];
}

// unsubscribe and remove from  the tracker
export function unsubscribe (tracker) {
  tracker.current.isActive = false;

  if (tracker.current.subscriber) {
    tracker.current.subscriber.then((unsubFn) => unsubFn()).catch(console.error);
    tracker.current.subscriber = null;
  }
}

// subscribe, trying to play nice with the browser threads
function subscribe (mountedRef, tracker, fn, params, setValue, { transform = transformIdentity, withParams, withParamsTransform } = {}) {
  const validParams = params.filter((p) => !isUndefined(p));

  unsubscribe(tracker);

  setTimeout(() => {
    if (mountedRef.current) {
      if (fn && (!fn.meta || !fn.meta.type?.isDoubleMap || validParams.length === 2)) {
        // swap to acive mode
        tracker.current.isActive = true;

        tracker.current.subscriber = fn(...params, (value) => {
          // we use the isActive flag here since .subscriber may not be set on immediate callback)
          if (mountedRef.current && tracker.current.isActive) {
            mountedRef.current && tracker.current.isActive && setValue(
              withParams
                ? [params, transform(value)]
                : withParamsTransform
                  ? transform([params, value])
                  : transform(value)
            );
          }
        });
      } else {
        tracker.current.subscriber = null;
      }
    }
  }, 0);
}

// tracks a stream, typically an api.* call (derive, rpc, query) that
//  - returns a promise with an unsubscribe function
//  - has a callback to set the value
// FIXME The typings here need some serious TLC
export function useCall (fn, params, options) {
  const mountedRef = useIsMountedRef();
  const tracker = useRef({ isActive: false, serialized: null, subscriber: null });
  const [value, setValue] = useState((options || {}).defaultValue);

  // initial effect, we need an un-subscription
  useEffect(() => {
    return () => unsubscribe(tracker);
  }, []);

  // on changes, re-subscribe
  useEffect(() => {
    // check if we have a function & that we are mounted
    if (mountedRef.current && fn) {
      const [serialized, mappedParams] = extractParams(fn, params || [], options);

      if (mappedParams && serialized !== tracker.current.serialized) {
        tracker.current.serialized = serialized;

        subscribe(mountedRef, tracker, fn, mappedParams, setValue, options);
      }
    }
  }, [fn, options, mountedRef, params]);

  return value;
}
